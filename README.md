# fyp-backend

**Connect to Heroku DB using psql**

Server connection terminal script: 
psql --host=HOSTNAME --port=5432 --username=USERNAME --password=PASSWORD --dbname=DBNAME
(get credentials from heroku settings

To push psql code to server (use separate terminal): 
heroku pg:psql --app borderless-frontend < borderless.sql
