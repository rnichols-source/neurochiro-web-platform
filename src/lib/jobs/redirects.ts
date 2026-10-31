/** Career URLs that permanently move to /jobs. /careers/salaries stays put. */
export const JOB_REDIRECTS: { source: string; destination: string; permanent: true }[] = [
  { source: '/careers/post', destination: '/jobs/post', permanent: true },
  { source: '/careers', destination: '/jobs', permanent: true },
  { source: '/careers/:id([0-9a-fA-F-]{36})', destination: '/jobs/:id', permanent: true },
];
