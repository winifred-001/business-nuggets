import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { db } from '../prisma/db';
import {
  CreateCategoryDto,
  CreateTopicDto,
  UpdateCategoryDto,
  UpdateTopicDto,
} from './topics.dto';
import {
  parseTaxonomyCsv,
  taxonomyKey,
  taxonomySlug,
  type TaxonomyRow,
} from './topics-csv';
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
@Injectable()
export class TopicsService {
  private validateName(name: string) {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 120 || !taxonomySlug(trimmed))
      throw new BadRequestException(
        'Enter a name of 1–120 characters containing letters or numbers.',
      );
    return trimmed;
  }
  private unique(
    items: { id: number; name: string; slug: string }[],
    name: string,
    id?: number,
  ) {
    if (
      items.some(
        (item) =>
          item.id !== id &&
          (taxonomyKey(item.name) === taxonomyKey(name) ||
            item.slug === taxonomySlug(name)),
      )
    )
      throw new ConflictException(
        'An item with this name or URL slug already exists.',
      );
  }
  private async syncFromNuggets() {
    const [nuggets, topics] = await Promise.all([
      db.orm.public.Nugget.all(),
      db.orm.public.Topic.all(),
    ]);
    const names = new Set(topics.map((topic) => taxonomyKey(topic.name)));
    const slugs = new Set(topics.map((topic) => topic.slug));
    let order = Math.max(-1, ...topics.map((topic) => topic.displayOrder)) + 1;
    for (const nugget of nuggets) {
      const name = nugget.topic?.trim();
      if (
        !name ||
        names.has(taxonomyKey(name)) ||
        slugs.has(taxonomySlug(name))
      )
        continue;
      try {
        await db.orm.public.Topic.create({
          name,
          slug: taxonomySlug(name),
          description: null,
          visible: true,
          displayOrder: order++,
          categoryId: null,
        });
      } catch (cause) {
        // Another concurrent list request may have synchronized the same topic.
        const existing = await db.orm.public.Topic.where({
          slug: taxonomySlug(name),
        }).first();
        if (!existing) throw cause;
      }
      names.add(taxonomyKey(name));
      slugs.add(taxonomySlug(name));
    }
  }
  async getPublicCatalog() {
    const [topics, categories, nuggets] = await Promise.all([
      db.orm.public.Topic.all(),
      db.orm.public.Category.all(),
      db.orm.public.Nugget.where({ status: 'published' }).all(),
    ]);
    const visibleCategories = categories.filter(category => category.visible);
    const publicTopics = topics
      .filter(topic => topic.visible && (topic.categoryId === null || visibleCategories.some(category => category.id === topic.categoryId)))
      .sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id)
      .map(topic => ({
        id: topic.id,
        name: topic.name,
        slug: topic.slug,
        description: topic.description,
        categoryId: topic.categoryId,
        nuggetCount: nuggets.filter(nugget => taxonomyKey(nugget.topic) === taxonomyKey(topic.name)).length,
      }));
    return {
      topics: publicTopics,
      categories: visibleCategories
        .sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id)
        .map(category => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          nuggetCount: publicTopics.filter(topic => topic.categoryId === category.id).reduce((total, topic) => total + topic.nuggetCount, 0),
        })),
    };
  }

  async getAllTopics() {
    await this.syncFromNuggets();
    const [topics, nuggets, categories] = await Promise.all([
      db.orm.public.Topic.all(),
      db.orm.public.Nugget.all(),
      db.orm.public.Category.all(),
    ]);
    return topics
      .map((topic) => ({
        ...topic,
        categoryName:
          categories.find((category) => category.id === topic.categoryId)
            ?.name || null,
        nuggetCount: nuggets.filter(
          (nugget) => taxonomyKey(nugget.topic) === taxonomyKey(topic.name),
        ).length,
      }))
      .sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id);
  }
  async getCategories() {
    const [categories, topics] = await Promise.all([
      db.orm.public.Category.all(),
      db.orm.public.Topic.all(),
    ]);
    return categories
      .map((category) => ({
        ...category,
        topicCount: topics.filter((topic) => topic.categoryId === category.id)
          .length,
      }))
      .sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id);
  }
  async createTopic(input: CreateTopicDto) {
    return db.transaction(async (tx) => {
      const name = this.validateName(input.name),
        topics = await tx.orm.public.Topic.all();
      this.unique(topics, name);
      if (
        input.categoryId &&
        !(await tx.orm.public.Category.where({ id: input.categoryId }).first())
      )
        throw new BadRequestException('Category not found.');
      return tx.orm.public.Topic.create({
        name,
        slug: taxonomySlug(name),
        description: input.description?.trim() || null,
        visible: input.visible ?? true,
        displayOrder:
          Math.max(-1, ...topics.map((topic) => topic.displayOrder)) + 1,
        categoryId: input.categoryId ?? null,
      });
    });
  }
  async updateTopic(id: number, input: UpdateTopicDto) {
    return db.transaction(async (tx) => {
      const existing = await tx.orm.public.Topic.where({ id })
        .forUpdate()
        .first();
      if (!existing) throw new NotFoundException('Topic not found.');
      const name =
        input.name === undefined
          ? existing.name
          : this.validateName(input.name);
      this.unique(await tx.orm.public.Topic.all(), name, id);
      if (
        input.categoryId &&
        !(await tx.orm.public.Category.where({ id: input.categoryId }).first())
      )
        throw new BadRequestException('Category not found.');
      const updated = await tx.orm.public.Topic.where({ id }).update({
        ...input,
        name,
        slug: taxonomySlug(name),
        ...(input.description !== undefined && {
          description: input.description.trim() || null,
        }),
      });
      if (name !== existing.name) {
        const nuggets = (await tx.orm.public.Nugget.all()).filter(
          (nugget) => taxonomyKey(nugget.topic) === taxonomyKey(existing.name),
        );
        for (const nugget of nuggets)
          await tx.orm.public.Nugget.where({ id: nugget.id }).update({
            topic: name,
          });
        // Merge duplicate follows before renaming legacy string-based subscriptions.
        const follows = (await tx.orm.public.FollowedTopic.all()).filter(
          (follow) => taxonomyKey(follow.topic) === taxonomyKey(existing.name),
        );
        for (const follow of follows) {
          const duplicate = await tx.orm.public.FollowedTopic.where({
            userId: follow.userId,
            topic: name,
          }).first();
          if (duplicate && duplicate.id !== follow.id)
            await tx.orm.public.FollowedTopic.where({ id: follow.id }).delete();
          else
            await tx.orm.public.FollowedTopic.where({ id: follow.id }).update({
              topic: name,
            });
        }
      }
      return updated;
    });
  }
  async deleteTopic(id: number) {
    return db.transaction(async (tx) => {
      const topic = await tx.orm.public.Topic.where({ id }).forUpdate().first();
      if (!topic) throw new NotFoundException('Topic not found.');
      const nuggets = await tx.orm.public.Nugget.all();
      if (
        nuggets.some(
          (nugget) => taxonomyKey(nugget.topic) === taxonomyKey(topic.name),
        )
      )
        throw new ConflictException(
          'This topic is assigned to Nuggets. Reassign those Nuggets before deleting the topic.',
        );
      const follows = (await tx.orm.public.FollowedTopic.all()).filter(
        (follow) => taxonomyKey(follow.topic) === taxonomyKey(topic.name),
      );
      for (const follow of follows)
        await tx.orm.public.FollowedTopic.where({ id: follow.id }).delete();
      await tx.orm.public.Topic.where({ id }).delete();
      return { deleted: true };
    });
  }
  async createCategory(input: CreateCategoryDto) {
    return db.transaction(async (tx) => {
      const name = this.validateName(input.name),
        categories = await tx.orm.public.Category.all();
      this.unique(categories, name);
      return tx.orm.public.Category.create({
        name,
        slug: taxonomySlug(name),
        description: input.description?.trim() || null,
        visible: input.visible ?? true,
        displayOrder:
          Math.max(-1, ...categories.map((category) => category.displayOrder)) +
          1,
      });
    });
  }
  async updateCategory(id: number, input: UpdateCategoryDto) {
    return db.transaction(async (tx) => {
      const existing = await tx.orm.public.Category.where({ id })
        .forUpdate()
        .first();
      if (!existing) throw new NotFoundException('Category not found.');
      const name =
        input.name === undefined
          ? existing.name
          : this.validateName(input.name);
      this.unique(await tx.orm.public.Category.all(), name, id);
      return tx.orm.public.Category.where({ id }).update({
        ...input,
        name,
        slug: taxonomySlug(name),
        ...(input.description !== undefined && {
          description: input.description.trim() || null,
        }),
      });
    });
  }
  async deleteCategory(id: number) {
    return db.transaction(async (tx) => {
      if (!(await tx.orm.public.Category.where({ id }).forUpdate().first()))
        throw new NotFoundException('Category not found.');
      if ((await tx.orm.public.Topic.where({ categoryId: id }).all()).length)
        throw new ConflictException(
          'This category contains topics. Move those topics to another category or choose Uncategorized before deleting it.',
        );
      await tx.orm.public.Category.where({ id }).delete();
      return { deleted: true };
    });
  }
  async reorderTopics(ids: number[]) {
    if (new Set(ids).size !== ids.length)
      throw new BadRequestException('Each topic ID must appear only once.');
    await db.transaction(async (tx) => {
      const all = await tx.orm.public.Topic.all();
      if (
        ids.length !== all.length ||
        ids.some((id) => !all.some((topic) => topic.id === id))
      )
        throw new BadRequestException(
          'The topic list changed. Refresh and retry.',
        );
      for (let i = 0; i < ids.length; i++)
        await tx.orm.public.Topic.where({ id: ids[i] }).update({
          displayOrder: i,
        });
    });
    return this.getAllTopics();
  }
  async planImport(tx: Tx, rows: TaxonomyRow[]) {
    const [topics, categories] = await Promise.all([
      tx.orm.public.Topic.all(),
      tx.orm.public.Category.all(),
    ]);
    const categoryNames = new Map(
      categories.map((category) => [taxonomyKey(category.name), category]),
    );
    const plannedCategories = new Map<
      string,
      { name: string; description: string; visible: boolean }
    >();
    for (const row of rows.filter((row) => row.type === 'category'))
      if (!categoryNames.has(taxonomyKey(row.name)))
        plannedCategories.set(taxonomyKey(row.name), row);
    for (const row of rows.filter(
      (row) =>
        row.type === 'topic' &&
        row.category &&
        !topics.some(
          (topic) => taxonomyKey(topic.name) === taxonomyKey(row.name),
        ),
    ))
      if (
        !categoryNames.has(taxonomyKey(row.category)) &&
        !plannedCategories.has(taxonomyKey(row.category))
      )
        plannedCategories.set(taxonomyKey(row.category), {
          name: row.category,
          description: '',
          visible: true,
        });
    const namesBySlug = new Map(
      categories.map((category) => [category.slug, taxonomyKey(category.name)]),
    );
    for (const category of plannedCategories.values()) {
      const slug = taxonomySlug(category.name),
        key = taxonomyKey(category.name);
      if (namesBySlug.has(slug) && namesBySlug.get(slug) !== key)
        throw new BadRequestException(
          `Category "${category.name}" conflicts with an existing name or CSV category URL slug.`,
        );
      namesBySlug.set(slug, key);
    }
    const plannedTopics = rows.filter(
      (row) =>
        row.type === 'topic' &&
        !topics.some(
          (topic) => taxonomyKey(topic.name) === taxonomyKey(row.name),
        ),
    );
    for (const row of plannedTopics)
      if (topics.some((topic) => topic.slug === taxonomySlug(row.name)))
        throw new BadRequestException(
          `CSV row ${row.row}: topic "${row.name}" conflicts with an existing URL slug.`,
        );
    const createdNames = new Set(
      plannedTopics.map((row) => taxonomyKey(row.name)),
    );
    return {
      topics,
      categories,
      plannedCategories,
      plannedTopics,
      preview: {
        categoriesToCreate: plannedCategories.size,
        topicsToCreate: plannedTopics.length,
        skipped: rows.filter((row) =>
          row.type === 'category'
            ? categoryNames.has(taxonomyKey(row.name))
            : !createdNames.has(taxonomyKey(row.name)),
        ).length,
        rows: rows.map((row) => ({
          ...row,
          action:
            row.type === 'category'
              ? categoryNames.has(taxonomyKey(row.name))
                ? 'skip'
                : 'create'
              : createdNames.has(taxonomyKey(row.name))
                ? 'create'
                : 'skip',
        })),
      },
    };
  }
  async previewImport(csv: string) {
    const rows = parseTaxonomyCsv(csv);
    return db.transaction(
      async (tx) => (await this.planImport(tx, rows)).preview,
    );
  }
  async importCsv(csv: string) {
    const rows = parseTaxonomyCsv(csv);
    return db.transaction(async (tx) => {
      const plan = await this.planImport(tx, rows);
      return this.saveImport(tx, plan);
    });
  }
  async saveImport(
    tx: Tx,
    plan: Awaited<ReturnType<TopicsService['planImport']>>,
  ) {
    const categoryIds = new Map(
      plan.categories.map((category) => [
        taxonomyKey(category.name),
        category.id,
      ]),
    );
    let categoryOrder =
      Math.max(
        -1,
        ...plan.categories.map((category) => category.displayOrder),
      ) + 1;
    for (const [key, category] of plan.plannedCategories) {
      const created = await tx.orm.public.Category.create({
        name: category.name,
        visible: category.visible,
        slug: taxonomySlug(category.name),
        description: category.description || null,
        displayOrder: categoryOrder++,
      });
      if (!created)
        throw new ConflictException(
          'Could not create category. Refresh and retry.',
        );
      categoryIds.set(key, created.id);
    }
    let topicOrder =
      Math.max(-1, ...plan.topics.map((topic) => topic.displayOrder)) + 1;
    for (const topic of plan.plannedTopics)
      await tx.orm.public.Topic.create({
        name: topic.name,
        slug: taxonomySlug(topic.name),
        description: topic.description || null,
        visible: topic.visible,
        categoryId: topic.category
          ? categoryIds.get(taxonomyKey(topic.category))!
          : null,
        displayOrder: topicOrder++,
      });
    return {
      categoriesCreated: plan.plannedCategories.size,
      topicsCreated: plan.plannedTopics.length,
      skipped: plan.preview.skipped,
    };
  }
}
