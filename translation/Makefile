
all: app.json drivers.json flows.json capabilities.json

drivers.json: ../app.json
	@echo "Generating drivers.json"
	@cat $< | jq '.drivers' | jq 'del(.[].class, .[].capabilities, .[].platforms, .[].connectivity, .[].images, .[].pair, .[].settings, .[].discovery)' > $@

flows.json: ../app.json
	@echo "Generating flows.json"
	@cat $< | jq '.flow' | jq 'del(.triggers[].args, .conditions[].args, .actions[].args)' > $@

capabilities.json: ../app.json
	@echo "Generating capabilities.json"
	@cat $< | jq '.capabilities' > $@

app.json: ../app.json
	@echo "Generating app.json"
	@cat $< | jq 'del(._comment, .platforms, .category, .permissions, .images, .author, .brandColor, .contributors, .contributing, .source, .bugs, .support, .homeyCommunityTopicId, .flow, .drivers, .capabilities, .discovery)' > $@

