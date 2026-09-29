alter role authenticator set pgrst.db_schemas = 'public, graphql_public, concierge_ops';
notify pgrst, 'reload config';
