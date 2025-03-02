# Sela Web Developers' Guide

## Run App Locally 

### Setup Environment
- **Install `node.js` 20.** `nvm` is a cross-platform Node.js manager, and you are recommended to use it install node.js if you have other projects using different node versions. Check [https://nodejs.org/en/download](https://nodejs.org/en/download) for detailed instructions.

### Setup Project
1. clone the git project to your local
2. inside the project folder, create a `.env` file, and add the required credentials and variables. You can find the credentials on [clickup](https://app.clickup.com/), or contact the team for help.
3. inside the project folder, run `npm install` to install dependencies
4. run `npm run dev` to start the webapp, you should see the project running on your `localhost:3000`

## Add your changes

All changes should be added via [Pull Requests](https://github.com/teamsela/sela-webapp/pulls) and get reviewed before merging into the main branch. **You must not directly push to the main branch.**

Follow the steps below to add your change:
1. create a working branch from the main branch
2. work on your branch
3. push your changes to your remote branch
4. before creating a PR, you should run `npm run build` locally to check if there is any issue in your change. Sometimes you can successfully run it in dev mode but fail the build.
5. create a PR to merge your working branch into main in GitHub
6. resolve comments from other team members and merge conflicts (if any)
7. after your PR passes the check and is approved, it is ready to merge. Usually the admin will merge it for you. 
