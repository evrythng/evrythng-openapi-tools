# evrythng-openapi-tools

Tool to join (build), split, and validate OpenAPI 3.0 YAML API specification
files using a standardised directory and file naming convention.


## Installation

Install as a the CLI command `evrythng-openapi-tools`:

```
$ npm i -g evrythng-openapi-tools
```


## Usage

- [Join](#join)
- [Split](#split)
- [Validate](#validate)
- [Print Definition](#print-definition)
- [Print Fields](#print-fields)
- [Print Schema](#print-schema)
- [Print Operation](#print-operation)
- [Lint Schemas and Paths](#lint-schemas-and-paths)


### Join

Join repository spec files that meet the standardised directory and file naming
convention by providing paths to `base.yaml` files.

> More than one input directory (i.e: multiple API projects) can be specified
> after the output directory. Each must meet the directory structure outlined
> below.

`$ evrythng-openapi-tools join $inputDir $outputDir [$inputDir2, ...]`


### Split

Split a single OpenAPI spec file into components that meet the standardised
directory and file naming convention by providing the full spec and desired
output directory.

`$ evrythng-openapi-tools split $inputFile $outputDir`


### Validate

Validate an existing or joined OpenAPI spec file.

`$ evrythng-openapi-tools validate $inputFile`


### Print Definition

Print a trio of 'Fields', 'Schema', and 'Example' for documentation purposes.
The `summaryName` should be a `summary` that uses the schema in a `response`.

`$ evrythng-openapi-tools print-definition $inputFile $schemaName $summaryName`


### Print Fields

Print the properties of a schema as a list of fields + attributes for
documentation purposes.

`$ evrythng-openapi-tools print-fields $inputFile $schemaName`


### Print Schema

Print a reduced JSON Schema of a schema component for documentation purposes.

`$ evrythng-openapi-tools print-schema $inputFile $schemaName`


### Print Operation

Print a ReadMe.io-compatible Request/Response widget pair, featuring muliple
language examples, by summary such as 'Read all Thngs'.

`$ evrythng-openapi-tools print-operation $inputFile $summary`


### Lint Schemas and Paths

Lint all in `schemas` and `paths` for common things like `example`, and
`description` to help ensure format consistency.

`$ evrythng-openapi-tools lint $inputFile`


## Directory Structure

The directory structure for each repository's spec mirrors the internal
structure of a single OpenAPI spec:

```
/paths
/components
  /schemas
  /requestBodies
  /parameters
base.yaml
```

The following file naming conventions allow easy splitting and joining of
component files, as well as processing by documentation and testing tools.


#### Base File

Contains `openapi`, `info`, etc. Example:

```
base.yaml
```

> Must contain 'components' with empty objects for each of 'schemas',
> 'requestBodies', and 'parameters'.


#### Path File

A file containing an OpenAPI `path` object, where the key has `/` replaced with
`-`. Example:

```
projects-{projectId}-applications-{applicationId}.yaml
```


#### Parameter File

A file containing a single OpenAPI `parameters` object, which is the parameter
`name`. Example:

```
projectId.yaml
```


#### Request Body File

A file containing a single `requestBody` object, which is the request body
`name`. Example:

```
ProjectDocumentCreateBody.yaml
```

### Schema File

A file containing a single `schemas` object, which is the schema name. Example:

```
ThngDocument.yaml
```
