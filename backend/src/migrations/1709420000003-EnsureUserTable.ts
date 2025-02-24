import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class EnsureUserTable1709420000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Verificar si la tabla existe
    const tableExists = await queryRunner.hasTable("user");
    if (!tableExists) {
      await queryRunner.createTable(
        new Table({
          name: "user",
          columns: [
            {
              name: "id",
              type: "int",
              isPrimary: true,
              isGenerated: true,
              generationStrategy: "increment",
            },
            {
              name: "name",
              type: "varchar",
            },
            {
              name: "email",
              type: "varchar",
              isUnique: true,
            },
            {
              name: "password",
              type: "varchar",
            },
            {
              name: "created_at",
              type: "timestamp",
              default: "now()",
            },
            {
              name: "updated_at",
              type: "timestamp",
              default: "now()",
            },
          ],
        }),
        true
      );
    }

    // Verificar si existe el índice único para el email
    const hasEmailIndex = await queryRunner.hasTable("IDX_USER_EMAIL");
    if (!hasEmailIndex) {
      await queryRunner.createIndex(
        "user",
        new TableIndex({
          name: "IDX_USER_EMAIL",
          columnNames: ["email"],
          isUnique: true,
        })
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex("user", "IDX_USER_EMAIL");
    await queryRunner.dropTable("user");
  }
}
