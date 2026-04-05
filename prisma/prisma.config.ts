export default {
  migrations: {
    seed: 'npx tsx prisma/seed.ts',
  },
  datasource: {
    url: 'file:./dev.db',
  },
};
