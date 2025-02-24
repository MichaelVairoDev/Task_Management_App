import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateActivityTable1709420000001 implements MigrationInterface {
  name = "UpdateActivityTable1709420000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear el enum activity_type_enum
    await queryRunner.query(`
      CREATE TYPE "public"."activity_type_enum" AS ENUM(
        'Tarea Creada',
        'Tarea Actualizada',
        'Tarea Eliminada',
        'Comentario Agregado',
        'Estado Cambiado',
        'Asignación Cambiada'
      )
    `);

    // Eliminar la columna type existente y recrearla como enum
    await queryRunner.query(`ALTER TABLE "activity" DROP COLUMN "type"`);
    await queryRunner.query(`
      ALTER TABLE "activity" ADD "type" "public"."activity_type_enum" NOT NULL
    `);

    // Actualizar las columnas de relaciones
    await queryRunner.query(`ALTER TABLE "activity" DROP COLUMN "userId"`);
    await queryRunner.query(`ALTER TABLE "activity" DROP COLUMN "taskId"`);
    await queryRunner.query(`ALTER TABLE "activity" ADD "userId" integer`);
    await queryRunner.query(`ALTER TABLE "activity" ADD "taskId" integer`);

    // Agregar las restricciones de clave foránea
    await queryRunner.query(`
      ALTER TABLE "activity"
      ADD CONSTRAINT "FK_activity_user"
      FOREIGN KEY ("userId")
      REFERENCES "user"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "activity"
      ADD CONSTRAINT "FK_activity_task"
      FOREIGN KEY ("taskId")
      REFERENCES "task"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar las restricciones de clave foránea
    await queryRunner.query(`
      ALTER TABLE "activity" DROP CONSTRAINT "FK_activity_task"
    `);
    await queryRunner.query(`
      ALTER TABLE "activity" DROP CONSTRAINT "FK_activity_user"
    `);

    // Restaurar las columnas originales
    await queryRunner.query(`ALTER TABLE "activity" DROP COLUMN "taskId"`);
    await queryRunner.query(`ALTER TABLE "activity" DROP COLUMN "userId"`);
    await queryRunner.query(`
      ALTER TABLE "activity" ADD "taskId" integer
    `);
    await queryRunner.query(`
      ALTER TABLE "activity" ADD "userId" integer NOT NULL
    `);

    // Restaurar la columna type como varchar
    await queryRunner.query(`ALTER TABLE "activity" DROP COLUMN "type"`);
    await queryRunner.query(`
      ALTER TABLE "activity" ADD "type" character varying NOT NULL
    `);

    // Eliminar el enum
    await queryRunner.query(`DROP TYPE "public"."activity_type_enum"`);
  }
}
