# Regolith
cd ./Basic && mkdir -p ./packs/data && regolith watch &
cd ./Core.McHttp && mkdir -p ./packs/data && regolith watch &
cd ./Core.McWss && mkdir -p ./packs/data && regolith watch
wait