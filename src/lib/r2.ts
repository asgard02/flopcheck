import { S3Client, DeleteObjectsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

export function isR2Configured(): boolean {
  return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME);
}

function getR2Client(): S3Client | null {
  if (!isR2Configured()) return null;
  return new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID!,
      secretAccessKey: R2_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
  });
}

export async function deleteR2Clips(storageFolder: string): Promise<void> {
  const client = getR2Client();
  if (!client || !R2_BUCKET_NAME) return;

  const { Contents } = await client.send(
    new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: `${storageFolder}/`,
    })
  );

  if (!Contents?.length) return;

  const objects = Contents.filter((o) => o.Key).map(({ Key }) => ({ Key }));

  await client.send(
    new DeleteObjectsCommand({
      Bucket: R2_BUCKET_NAME,
      Delete: { Objects: objects },
    })
  );
}
