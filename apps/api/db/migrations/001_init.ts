import { sql, type DatabaseTransactionConnection } from 'slonik';

export async function up(tx: DatabaseTransactionConnection): Promise<void> {
  await tx.query(sql.unsafe`
    create table users (
      id uuid primary key default gen_random_uuid(),
      name text not null,
      created_at timestamptz not null default now()
    )
  `);

  await tx.query(sql.unsafe`
    create table rooms (
      id uuid primary key default gen_random_uuid(),
      name text not null
    )
  `);

  await tx.query(sql.unsafe`
    insert into rooms (name) values ('Room A'), ('Room B')
  `);
}

export async function down(tx: DatabaseTransactionConnection): Promise<void> {
  await tx.query(sql.unsafe`drop table rooms`);
  await tx.query(sql.unsafe`drop table users`);
}
