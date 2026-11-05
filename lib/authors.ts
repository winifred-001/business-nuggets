export type AuthorWork = {
  title: string;
  subtitle: string;
  type: "Musical" | "Commentary";
  href: string;
};

export type Author = {
  slug: string;
  name: string;
  roleLabel: string;
  description: string;
  bio: string;
  works: AuthorWork[];
};

export const authors: Author[] = [
  {
    slug: "amina-vance",
    name: "Amina Vance",
    roleLabel:
      "Musical Productions & Contributions",

    description:
      "Credited with London Symphony on The Balance of Negotiation Suite, and with BNB Sound on The Architectural Mind: Building with Nehemiah.",

    bio:
      "Amina Vance contributes to the musical interpretation of biblical-business teachings, helping translate themes of stewardship, negotiation and responsible leadership into cinematic musical experiences.",

    works: [
      {
        title:
          "The Balance of Negotiation Suite",

        subtitle:
          "Produced by Amina Vance & London Symphony",

        type: "Musical",

        href: "/musicals",
      },

      {
        title:
          "Building with Nehemiah",

        subtitle:
          "BNB Sound • Leadership & Strategy",

        type: "Musical",

        href: "/musicals",
      },
    ],
  },

  {
    slug: "david-o",
    name: "David O.",

    roleLabel:
      "Musical Contributions",

    description:
      "Listed with London Symphony on Joseph's Seven-Year Reserve Blueprint. Discover the credited work in the musical archive.",

    bio:
      "David O. is credited on selected musical works within the Business Nuggets archive, contributing to cinematic interpretations of biblical principles around reserves, stewardship and strategic preparation.",

    works: [
      {
        title:
          "Joseph's Seven-Year Reserve Blueprint",

        subtitle:
          "David O. & London Symphony • Genesis 41",

        type: "Musical",

        href: "/musicals",
      },
    ],
  },
];

export function getAuthorBySlug(
  slug: string,
) {
  return authors.find(
    (author) =>
      author.slug === slug,
  );
}