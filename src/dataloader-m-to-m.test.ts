import {
  Collection,
  Entity,
  ManyToMany,
  MikroORM,
  PrimaryKey,
  Property,
} from "@mikro-orm/sqlite";

@Entity()
export class Country {
  @PrimaryKey()
  code!: string;

  @Property()
  name!: string;

  constructor(code: string, name: string) {
    this.code = code;
    this.name = name;
  }
}

@Entity()
class User {
  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  @ManyToMany(() => Country)
  countries = new Collection<Country>(this);

  constructor(name: string) {
    this.name = name;
  }
}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ":memory:",
    entities: [User],
    debug: ["query", "query-params"],
    allowGlobalContext: true, // only for testing
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test("basic CRUD example", async () => {
  orm.em.create(User, {
    name: "Foo",
    countries: [new Country("US", "United States")],
  });
  await orm.em.flush();
  orm.em.clear();

  const reloaded = await orm.em.findOneOrFail(User, { name: "Foo" });

  // countries not loaded, as expected
  expect(reloaded.countries.isInitialized()).toBe(false);

  // throws `TypeError: Cannot read properties of undefined (reading '__helper')`
  await reloaded.countries.load({ dataloader: true });
});
