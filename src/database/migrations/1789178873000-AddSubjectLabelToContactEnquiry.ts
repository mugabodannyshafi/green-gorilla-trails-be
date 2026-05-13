import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubjectLabelToContactEnquiry1789178873000 implements MigrationInterface {
  name = 'AddSubjectLabelToContactEnquiry1789178873000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`ContactEnquiry\` ADD \`subject_label\` varchar(512) NOT NULL DEFAULT '' AFTER \`subject_key\``,
    );
    await queryRunner.query(
      `UPDATE \`ContactEnquiry\` SET \`subject_label\` = \`subject_key\` WHERE \`subject_label\` = ''`,
    );
    await queryRunner.query(
      `ALTER TABLE \`ContactEnquiry\` MODIFY \`subject_label\` varchar(512) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`ContactEnquiry\` MODIFY \`subject_key\` enum ('GENERAL', 'GORILLA', 'SAFARI', 'GROUP', 'OTHER') NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`ContactEnquiry\` MODIFY \`subject_key\` enum ('GENERAL', 'GORILLA', 'SAFARI', 'OTHER') NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE \`ContactEnquiry\` DROP COLUMN \`subject_label\``);
  }
}
