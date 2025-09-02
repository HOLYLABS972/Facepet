CREATE INDEX "idx_pets_user_id" ON "pets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_pets_owner_id" ON "pets" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_pets_vet_id" ON "pets" USING btree ("vet_id");--> statement-breakpoint
CREATE INDEX "idx_pets_gender_id" ON "pets" USING btree ("gender_id");--> statement-breakpoint
CREATE INDEX "idx_pets_breed_id" ON "pets" USING btree ("breed_id");