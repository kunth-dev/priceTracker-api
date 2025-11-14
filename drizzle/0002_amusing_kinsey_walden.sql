CREATE TABLE "confirmation_tokens" (
	"email" text PRIMARY KEY NOT NULL,
	"token" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "confirmation_tokens_token_unique" UNIQUE("token")
);
