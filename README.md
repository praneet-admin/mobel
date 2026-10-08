# Mobel — Import, Export & Global Freight Forwarding

Live: https://praneet-admin.github.io/mobel/

Static site (HTML/CSS/JS, no build step). The contact form and the rate-alert
sign-up post to the **Zoho CRM** web-to-lead form "Mobel Website Enquiry", so
every enquiry is created as a Lead in Zoho CRM with:

- Lead Source: *Web Research* (enquiries) or *Web Download* (rate-alert sign-ups)
- Lead Status: *Not Contacted*
- Description: service, lane, message, plus landing page, referrer and any
  `utm_*` / `gclid` / `fbclid` campaign tags from the visit

Without JavaScript the form still posts and Zoho redirects to `thank-you.html`.
