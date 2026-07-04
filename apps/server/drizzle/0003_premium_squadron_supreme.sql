ALTER TABLE "users" ADD COLUMN "wechat_open_id" varchar(64);--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_wechat_open_id_unique" UNIQUE("wechat_open_id");