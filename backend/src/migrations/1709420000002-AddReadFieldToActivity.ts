import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReadFieldToActivity1709420000002 implements MigrationInterface {
  name = "AddReadFieldToActivity1709420000002";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "activity" ADD "read" boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "activity" DROP COLUMN "read"
    `);
  }
}
