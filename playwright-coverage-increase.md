using chrome devtools or any better browser agent, run through skills.iblai.ai using the PROD credentials on the .env file and land

on the demo tenant (check to see if u under that tenant by clicking on the user profile icon in the top right corner and switching to that tenant) for both admin and student account, run through the entire website and test all the features by clicking around especially 

on the course content pages.

- Notice the fundamental difference between the admin and student accounts on the sidebar menu items & user profile dropdown menu items.
- On the course content page, when on Agent tab, test out the voice record functionality by clicking on the microphone icon and speaking into the microphone. Test out the voice call feature by clicking on the phone icon and calling the agent.
- On the course content page, notice the fundamental difference between the admin and student accounts regarding the tabs (Agent, Course, Progress, Dates, Discussion etc)
- Test out the full screen mode on the course content page by clicking on the full screen icon in the top right corner.
- If the media dropdown menu is visible, test out the functionality of the media dropdown menu items.
- On the agent tab, Test out the autoplay feature on the course content page by clicking on the autoplay icon in the top right corner. When activated, test out the functionality of the autoplay feature by making sure when chatting with the agent, the agent responds after a while with an audio
- Click on other tabs (Course, Progress, Dates, Discussion) on the course content pages and test out the functionality of the tabs.



The end goal is to have extensive playwright tests for the lms platform here by updating the tests in the @e2e folder in this repo, including the following:

for both non admin account tests and admin account tests.

So when u are done with the tests, run the local instance of this app with 

pnpm build
PORT=3002 pnpm start

and run the playwright tests against the local instance of this app.


