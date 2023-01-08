
translations: app.json drivers.json flows.json capabilities.json locales READMEs

drivers.json: ../app.json
	@echo "Generating drivers.json"
	@cat $< | jq '.drivers' | jq 'del(.[].class, .[].capabilities, .[].platforms, .[].connectivity, .[].images, .[].pair, .[].discovery)' > $@

flows.json: ../app.json
	@echo "Generating flows.json"
	@cat $< | jq '.flow' | jq 'del(.triggers[].args, .conditions[].args, .actions[].args)' > $@

capabilities.json: ../app.json
	@echo "Generating capabilities.json"
	@cat $< | jq '.capabilities' > $@

app.json: ../app.json
	@echo "Generating app.json"
	@cat $< | jq 'del(._comment, .platforms, .category, .permissions, .images, .author, .brandColor, .contributors, .contributing, .source, .bugs, .support, .homeyCommunityTopicId, .flow, .drivers, .capabilities, .discovery)' > $@

locales: en.json nl.json de.json fr.json

en.json: ../locales/en.json
	@echo "Generating en.json"
	@cat $<  > $@

nl.json: ../locales/nl.json
	@echo "Generating nl.json"
	@cat $<  > $@

de.json: ../locales/de.json
	@echo "Generating de.json"
	@cat $<  > $@

fr.json: ../locales/fr.json
	@echo "Generating fr.json"
	@cat $<  > $@

READMEs: README.txt README.nl.txt README.de.txt README.fr.txt

README.txt: ../README.txt
	@echo "Generating README.txt"
	@cat $<  > $@

README.nl.txt: ../README.nl.txt
	@echo "Generating README.nl.txt"
	@cat $<  > $@

README.de.txt: ../README.de.txt
	@echo "Generating README.de.txt"
	@cat $<  > $@

README.fr.txt: ../README.fr.txt
	@echo "Generating README.fr.txt"
	@cat $<  > $@
