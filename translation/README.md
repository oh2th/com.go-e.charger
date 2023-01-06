# Howto translate

These files are for translation of the application only and are not actively used.
When I receive a pull request I'll review them and then update the translation to the main files.
To edit the files fork this repository for your self and once you are done make a pull request for review and merging to the main repository.

## Application main information

app.json file contains the main information of the application.

- Verify `description` and `tags`.
- In the translators section add your name with the language flag.

```json
    "translators": [
      {
        "name": "🇬🇧 Tapio Heiskanen"
      },
      {
        "name": "🇳🇱 "
      },
      {
        "name": "🇩🇪 "
      },
      {
        "name": "🇫🇷 "
      }
    ]
```

### Status

- nl - auto translated, needs verification
- de - auto translated, needs verification
- fr - auto translated, needs verification

## README files

There is one plain text file for each language. Update the files as necessary.

### Status - README

- README.nl.txt - auto translated, needs verification
- README.de.txt - German place holder, all in english now
- README.fr.txt - French place holder, all in english now

## Capabilities and flows and drivers

One json formatted file for each, search for your language for example:

- `"de":` to find every entry for your language and check them.

### Status - json

- nl - auto translated, needs verification
- de - auto translated, needs verification
- fr - auto translated, needs verification

## Locale files

There are also language specific locale files XX.json for some translated objects used in pairing html/script pages.

### Status - locale

- nl.json - Dutch place holder, all in english now
- de.json - German place holder, all in english now
- fr.json - French place holder, all in english now
