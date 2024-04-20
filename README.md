## Test the functions locally
build the project

`npm run build`

Start the emulator

`firebase emulators:start`

Use curl

`curl -X POST http://127.0.0.1:5001/fly-with-me-415500/us-central1/widgets/createCompanionAccount`

With body

curl -X POST -H "Content-Type: application/json" \
--data '{"accountId":"acct_1P7iFG07OBdgdhoQ"}' \
http://127.0.0.1:5001/fly-with-me-415500/us-central1/widgets/linkCompanionAccount


Follow this guide: https://www.webdew.com/blog/set-up-stripe-connect-marketplace-account

Connected accounts are only necessary for service providers (travel companion)