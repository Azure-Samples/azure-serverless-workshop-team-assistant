#!/bin/bash

# Set variables 
resourceGroupName='votingbot'
location='eastus'
storageAccountName='<<<<Replace-with-Your-Unique-Name>>>>'
functionAppName='<<<<Replace-with-Your-Unique-Name>>>>'
votingBotCosmosDBConnStr='<<<<Replace-with-Your-CosmosDB-ConnStr>>>>'
databaseName='votingbot'
collectionName='votingbot'
partitionkeypath='/votingname'

# Create an azure storage account
az storage account create \
  --name $storageAccountName \
  --location $location \
  --resource-group $resourceGroupName \
  --sku Standard_LRS

# Create Function App
az functionapp create \
  --name $functionAppName \
  --storage-account $storageAccountName \
  --consumption-plan-location $location \
  --resource-group $resourceGroupName

# Configure the function for v2 and add the cosmosDB connection string
az functionapp config appsettings set --name $functionAppName \
--resource-group $resourceGroupName \
--settings FUNCTIONS_EXTENSION_VERSION=beta votingbot_COSMOSDB=$votingBotCosmosDBConnStr