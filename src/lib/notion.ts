import { Client } from '@notionhq/client';
import type {
  PageObjectResponse,
  QueryDataSourceParameters,
} from '@notionhq/client/build/src/api-endpoints';
import { NotionToMarkdown } from 'notion-to-md';
import { marked } from 'marked';

const notion = new Client({ auth: import.meta.env.NOTION_API_KEY });
const n2m = new NotionToMarkdown({ notionClient: notion });

const dataSourceIdCache = new Map<string, Promise<string>>();

function getDataSourceId(databaseId: string): Promise<string> {
  let promise = dataSourceIdCache.get(databaseId);
  if (!promise) {
    promise = notion.databases.retrieve({ database_id: databaseId }).then((db) => {
      if (!('data_sources' in db)) {
        throw new Error(`Notion database ${databaseId} response is missing data_sources — check the ID and integration access.`);
      }
      return db.data_sources[0].id;
    });
    dataSourceIdCache.set(databaseId, promise);
  }
  return promise;
}

const WORDS_PER_MINUTE = 200;

export interface PostSummary {
  pageId: string;
  slug: string;
  title: string;
  dek: string;
  date: string;
  tags: string[];
}

export interface Post extends PostSummary {
  read: string;
  contentHtml: string;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function plainText(rich: { plain_text: string }[] | undefined): string {
  return (rich ?? []).map((r) => r.plain_text).join('');
}

function formatDate(iso: string | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

function toPostSummary(page: PageObjectResponse): PostSummary {
  const props = page.properties;

  const titleProp = props['Title'];
  const title = titleProp?.type === 'title' ? plainText(titleProp.title) : '';

  const slugProp = props['Slug'];
  const slugText = slugProp?.type === 'rich_text' ? plainText(slugProp.rich_text) : '';

  const summaryProp = props['Summary'];
  const dek = summaryProp?.type === 'rich_text' ? plainText(summaryProp.rich_text) : '';

  const dateProp = props['Date'];
  const date = dateProp?.type === 'date' ? formatDate(dateProp.date?.start) : '';

  const tagsProp = props['Tags'];
  const tags = tagsProp?.type === 'multi_select' ? tagsProp.multi_select.map((t) => t.name) : [];

  return {
    pageId: page.id,
    slug: slugText || slugify(title),
    title,
    dek,
    date,
    tags,
  };
}

export async function getPublishedPosts(): Promise<PostSummary[]> {
  const dataSourceId = await getDataSourceId(import.meta.env.NOTION_DATABASE_ID);
  const filter: QueryDataSourceParameters['filter'] = {
    property: 'Status',
    select: { equals: 'Published' },
  };

  const res = await notion.dataSources.query({
    data_source_id: dataSourceId,
    filter,
    sorts: [{ property: 'Date', direction: 'descending' }],
  });

  return res.results.filter((p): p is PageObjectResponse => 'properties' in p).map(toPostSummary);
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const posts = await getPublishedPosts();
  const match = posts.find((p) => p.slug === slug);
  if (!match) return null;

  const mdBlocks = await n2m.pageToMarkdown(match.pageId);
  const mdString = n2m.toMarkdownString(mdBlocks).parent ?? '';
  const contentHtml = await marked.parse(mdString);

  const wordCount = mdString.split(/\s+/).filter(Boolean).length;
  const read = `${Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE))} min`;

  return { ...match, read, contentHtml };
}

export interface DeskItem {
  category: string;
  name: string;
  by: string;
  meta: string;
}

function toDeskItem(page: PageObjectResponse): DeskItem | null {
  const props = page.properties;

  const nameProp = props['Name'];
  const name = nameProp?.type === 'title' ? plainText(nameProp.title) : '';

  const byProp = props['By'];
  const by = byProp?.type === 'rich_text' ? plainText(byProp.rich_text) : '';

  const metaProp = props['Meta'];
  const meta = metaProp?.type === 'rich_text' ? plainText(metaProp.rich_text) : '';

  const categoryProp = props['Category'];
  const category = categoryProp?.type === 'select' ? categoryProp.select?.name : undefined;

  if (!category) return null;

  return { category, name, by, meta };
}

export async function getDeskItems(): Promise<DeskItem[]> {
  const dataSourceId = await getDataSourceId(import.meta.env.NOTION_DESK_DATABASE_ID);

  const res = await notion.dataSources.query({
    data_source_id: dataSourceId,
    sorts: [{ property: 'Order', direction: 'ascending' }],
  });

  return res.results
    .filter((p): p is PageObjectResponse => 'properties' in p)
    .map(toDeskItem)
    .filter((item): item is DeskItem => item !== null);
}
