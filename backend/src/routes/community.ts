import { Elysia, t } from "elysia";
import { desc, eq } from "drizzle-orm";
import { db } from "../db";
import { template, plugin } from "../db/schema";
import { auth } from "../auth";

export const communityRoutes = new Elysia({ prefix: "/api/community" })
  .get("/templates", async () => {
    const templates = await db
      .select()
      .from(template)
      .where(eq(template.isPublic, true))
      .orderBy(desc(template.createdAt))
      .limit(50);

    return { data: templates };
  })

  .post(
    "/templates",
    async ({ request, body, set }) => {
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session) {
        set.status = 401;
        return { error: "Unauthorized. You must be logged in to publish." };
      }

      try {
        const inserted = await db
          .insert(template)
          .values({
            authorId: session.user.id,
            title: body.title,
            thumbnailUrl: body.thumbnailUrl,
            document: body.document,
            isPublic: true,
          })
          .returning();

        return { data: inserted[0] };
      } catch (err) {
        console.error(err);
        set.status = 500;
        return { error: "Failed to publish template" };
      }
    },
    {
      body: t.Object({
        title: t.String(),
        thumbnailUrl: t.String(),
        document: t.Any(),
      }),
    }
  )

  .get("/plugins", async () => {
    const plugins = await db
      .select()
      .from(plugin)
      .where(eq(plugin.isApproved, true))
      .orderBy(desc(plugin.createdAt));

    return { data: plugins };
  });