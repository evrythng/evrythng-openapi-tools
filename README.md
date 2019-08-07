# evrythng-openapi-tools

Tool to join (build), split, and validate OpenAPI 3.0 YAML API specification
files using a standardised directory and file naming convention.


## Installation

2. `npm install`
3. `npm i -g .` to install as a the CLI command `evrythng-openapi-tools`


## Usage

- [Join](#join)
- [Split](#split)
- [Validate](#validate)
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

`evrythng-openapi-tools join $INPUT_DIR $OUTPUT_DIR [$INPUT_DIR_2 ...]`


### Split

Split a single OpenAPI spec file into components that meet the standardised
directory and file naming convention by providing the full spec and desired
output directory.

`evrythng-openapi-tools split $INPUT_FILE $OUTPUT_DIR`


### Validate

Validate an existing or joined OpenAPI spec file.

`evrythng-openapi-tools validate $INPUT_FILE`


### Print Fields

Print the properties of a schema as a list of fields + attributes for
documentation purposes.

`evrythng-openapi-tools print-fields $INPUT_FILE $SCHEMA_NAME`


### Print Schema

Print a reduced JSON Schema of a schema component for documentation purposes.

`evrythng-openapi-tools print-schema $INPUT_FILE $SCHEMA_NAME`


### Print Operation

Print a ReadMe.io-compatible Request/Response widget pair, featuring muliple
language examples, by summary such as 'Read all Thngs'.

`evrythng-openapi-tools print-operation $INPUT_FILE $SUMMARY`


### Lint Schemas and Paths

Lint all in `schemas` and `paths` for common things like `example`, and
`description` to help ensure format consistency.

`evrythng-openapi-tools lint $INPUT_FILE`


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
