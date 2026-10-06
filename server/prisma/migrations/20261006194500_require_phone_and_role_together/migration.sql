ALTER TABLE "User"
ADD CONSTRAINT "User_phone_role_null_together_check"
CHECK (("phone" IS NULL) = ("role" IS NULL));
