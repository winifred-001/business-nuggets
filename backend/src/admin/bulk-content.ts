import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { db } from '../prisma/db';
import { taxonomyKey } from '../topics/topics-csv';
import { BulkContentDto } from './dto/bulk-content.dto';

export async function bulkContent(
  kind: 'nuggets' | 'topics' | 'categories',
  input: BulkContentDto,
) {
  const allowed =
    kind === 'nuggets'
      ? ['delete', 'publish', 'draft', 'feature', 'unfeature', 'gold', 'free']
      : kind === 'topics'
        ? ['delete', 'show', 'hide', 'gold', 'free']
        : ['delete', 'show', 'hide'];
  if (!allowed.includes(input.action))
    throw new BadRequestException(
      'This action is not supported for the selected content type.',
    );
  // Defensive validation also protects internal/service callers.
  if (
    !Array.isArray(input.ids) ||
    !input.ids.length ||
    input.ids.length > 5000 ||
    new Set(input.ids).size !== input.ids.length
  )
    throw new BadRequestException('Select 1–5000 distinct items.');
  if (
    kind !== 'nuggets' &&
    input.ids.some(
      (id) =>
        !/^[1-9]\d*$/.test(id) || Number(id) < 1 || Number(id) > 2147483647,
    )
  )
    throw new BadRequestException('Invalid topic or category ID.');
  return db.transaction(async (tx) => {
    if (kind === 'nuggets') {
      const items = [];
      for (const id of [...input.ids].sort()) {
        const item = await tx.orm.public.Nugget.where({ id })
          .forUpdate()
          .first();
        if (!item)
          throw new NotFoundException(
            'A selected Nugget no longer exists. Refresh the list.',
          );
        items.push(item);
      }
      for (const item of items) {
        const where = tx.orm.public.Nugget.where({ id: item.id });
        if (input.action === 'delete') await where.delete();
        else if (input.action === 'publish' || input.action === 'draft')
          await where.update({
            status: input.action === 'publish' ? 'published' : 'draft',
            publishedAt:
              input.action === 'publish'
                ? item.publishedAt || new Date().toISOString()
                : null,
          });
        else if (input.action === 'gold' || input.action === 'free')
          await where.update({ isGold: input.action === 'gold' });
        else await where.update({ featured: input.action === 'feature' });
      }
    } else if (kind === 'topics') {
      const items = [];
      for (const id of input.ids.map(Number).sort((a, b) => a - b)) {
        const item = await tx.orm.public.Topic.where({ id })
          .forUpdate()
          .first();
        if (!item)
          throw new NotFoundException(
            'A selected topic no longer exists. Refresh the list.',
          );
        items.push(item);
      }
      if (input.action === 'gold' || input.action === 'free') {
        const names = new Set(items.map((item) => taxonomyKey(item.name)));
        const nuggets = (await tx.orm.public.Nugget.all())
          .filter((item) => names.has(taxonomyKey(item.topic)))
          .sort((a, b) => a.id.localeCompare(b.id));
        for (const nugget of nuggets) {
          const where = tx.orm.public.Nugget.where({ id: nugget.id });
          const current = await where.forUpdate().first();
          if (!current || !names.has(taxonomyKey(current.topic)))
            throw new ConflictException('A Nugget changed during this action. Refresh and retry. Nothing was changed.');
          await tx.orm.public.Nugget.where({ id: nugget.id }).update({
            isGold: input.action === 'gold',
          });
        }
        return { affected: input.ids.length, nuggetsAffected: nuggets.length, action: input.action };
      }
      if (input.action === 'delete') {
        const names = new Set(items.map((item) => taxonomyKey(item.name)));
        const used = (await tx.orm.public.Nugget.all()).filter((item) =>
          names.has(taxonomyKey(item.topic)),
        );
        if (used.length)
          throw new ConflictException(
            `Selected topics contain ${used.length} Nuggets. Reassign those Nuggets before deleting. Nothing was deleted.`,
          );
        for (const follow of await tx.orm.public.FollowedTopic.all())
          if (names.has(taxonomyKey(follow.topic)))
            await tx.orm.public.FollowedTopic.where({ id: follow.id }).delete();
      }
      for (const item of items)
        if (input.action === 'delete')
          await tx.orm.public.Topic.where({ id: item.id }).delete();
        else
          await tx.orm.public.Topic.where({ id: item.id }).update({
            visible: input.action === 'show',
          });
    } else {
      const ids = input.ids.map(Number).sort((a, b) => a - b);
      for (const id of ids)
        if (!(await tx.orm.public.Category.where({ id }).forUpdate().first()))
          throw new NotFoundException(
            'A selected category no longer exists. Refresh the list.',
          );
      if (input.action === 'delete') {
        const used = (await tx.orm.public.Topic.all()).filter(
          (topic) =>
            topic.categoryId !== null && ids.includes(topic.categoryId),
        );
        if (used.length)
          throw new ConflictException(
            `Selected categories contain ${used.length} topics. Move or uncategorize those topics first. Nothing was deleted.`,
          );
      }
      for (const id of ids)
        if (input.action === 'delete')
          await tx.orm.public.Category.where({ id }).delete();
        else
          await tx.orm.public.Category.where({ id }).update({
            visible: input.action === 'show',
          });
    }
    return { affected: input.ids.length, action: input.action };
  });
}
