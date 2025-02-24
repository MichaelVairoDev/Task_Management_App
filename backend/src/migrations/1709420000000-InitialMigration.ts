import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1709420000000 implements MigrationInterface {
  name = "InitialMigration1709420000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."task_status_enum" AS ENUM('Pendiente', 'En Progreso', 'Completada')
        `);

    await queryRunner.query(`
            CREATE TABLE "user" (
                "id" SERIAL NOT NULL,
                "name" character varying NOT NULL,
                "email" character varying NOT NULL,
                "password" character varying NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"),
                CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "task" (
                "id" SERIAL NOT NULL,
                "title" character varying NOT NULL,
                "description" text NOT NULL,
                "status" "public"."task_status_enum" NOT NULL DEFAULT 'Pendiente',
                "dueDate" TIMESTAMP NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "assigneeId" integer,
                CONSTRAINT "PK_fb213f79ee45060ba925ecd576e" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "comment" (
                "id" SERIAL NOT NULL,
                "text" text NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "userId" integer,
                "taskId" integer,
                CONSTRAINT "PK_0b0e4bbc8415ec426f87f3a88e2" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "activity" (
                "id" SERIAL NOT NULL,
                "description" text NOT NULL,
                "type" character varying NOT NULL,
                "userId" integer NOT NULL,
                "taskId" integer,
                "timestamp" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_24625a1d6b1b089c8ae206fe467" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            ALTER TABLE "task" ADD CONSTRAINT "FK_task_assignee" 
            FOREIGN KEY ("assigneeId") REFERENCES "user"("id") 
            ON DELETE SET NULL ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            ALTER TABLE "comment" ADD CONSTRAINT "FK_comment_user" 
            FOREIGN KEY ("userId") REFERENCES "user"("id") 
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            ALTER TABLE "comment" ADD CONSTRAINT "FK_comment_task" 
            FOREIGN KEY ("taskId") REFERENCES "task"("id") 
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "comment" DROP CONSTRAINT "FK_comment_task"`
    );
    await queryRunner.query(
      `ALTER TABLE "comment" DROP CONSTRAINT "FK_comment_user"`
    );
    await queryRunner.query(
      `ALTER TABLE "task" DROP CONSTRAINT "FK_task_assignee"`
    );
    await queryRunner.query(`DROP TABLE "activity"`);
    await queryRunner.query(`DROP TABLE "comment"`);
    await queryRunner.query(`DROP TABLE "task"`);
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TYPE "public"."task_status_enum"`);
  }
}
