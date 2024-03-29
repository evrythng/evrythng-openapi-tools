# evrythng-openapi-tools

Tool to join (build), split, and validate OpenAPI 3.0 YAML API specification
files using a standardised directory and file naming convention.

Also includes several commands to generate familiar ReadMe.io-compatible
documentation snippets to help preserve structure and style.

- [Installation](#installation)
- [Work with specs](#work-with-specs)
- [Generate documentation](#generate-documentation)


## Installation

Install as a the CLI command `evrythng-openapi-tools`:

```
$ npm i -g evrythng-openapi-tools
```


## Work with specs

- [Join](#join)
- [Split](#split)
- [Validate](#validate)
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

`$ evrythng-openapi-tools split $specFile $outputDir`


### Validate

Validate an existing or joined OpenAPI spec file.

`$ evrythng-openapi-tools validate $specFile`


### Lint Schemas and Paths

Lint all in `schemas` and `paths` for common things like `example`, and
`description` to help ensure format consistency.

`$ evrythng-openapi-tools lint $specFile`


## Generate Documentation

To generate a page designed for ReadMe.io for a given API, use the `print page`
command specifying the `tag` for the API. The output will be written to a
local file of the same name as the `tag`. `specFile` is the complete spec file
obtained using the `join` command:

`$ evrythng-openapi-tools print $specFile page $tag`

> Some sections and examples will still need to be finished manually.

If more granular printing of individual page sections is needed, use the
following commands:

- [Print API Status](#print-api-status)
- [Print Definitions](#print-definitions)
- [Print Operations](#print-operations)
- [Print Filter Table](#print-filter-table)
- [Print API Key Permissions List](#print-api-key-permissions-list)


### Print API Status

Print the 'API Status' section for a given `tag`, such as `Thngs`. Paths with
operations using the tag will be listed as 'General Availability' unless the
path has `x-api-status` set to something else, such as 'Beta'. For example:

```
/thngs/{thngId}:
  x-api-status: Beta
  get:
    tags:
      - Thngs
    summary: Read a Thng
    ...
```

`$ evrythng-openapi-tools print $specFile api-status $tag`


### Print Definitions

Run `definition`, but for all definitions associated to a `tag`, such as
"Thngs". You will be asked to order the applicable definitions before the final
output is printed.

`$ evrythng-openapi-tools print $specFile definitions $tag`


#### Print Definition

> Included in `definitions`.

Print a trio of 'Fields', 'Schema', and 'Example' for documentation purposes.
The `summaryName` should be a `summary` from an operation that uses the schema
in its `responses`.

If the definition contains any `$ref` to other schemas, A 'See Also' section
will also be generated as expected at the bottom of the widget.

If the definition includes `x-filterable-fields`, a table of filterable fields
and supported operators will be included as well.

`$ evrythng-openapi-tools print $specFile definition $schemaName $summaryName`


#### Print Fields

> Included in `definition`.

Print the properties of a schema as a list of fields + attributes for
documentation purposes.

`$ evrythng-openapi-tools print $specFile fields $schemaName`


#### Print Schema

> Included in `definition`.

Print a reduced JSON Schema of a schema component for documentation purposes.

`$ evrythng-openapi-tools print $specFile schema $schemaName`


### Print Operations

Print Request/Response widget pairs for a given `tag` all at the same time. You
will be asked to order the applicable summaries before the final output is
printed.

`$ evrythng-openapi-tools print $specFile operations $tag`


#### Print Operation

> Included in `operations`.

Print a ReadMe.io-compatible Request/Response widget pair, featuring muliple
language examples, by summary such as 'Read all Thngs'.

`$ evrythng-openapi-tools print $specFile operation $summary`


### Print Filter Table

Print a ReadMe.io-compatible table widget for use in the Filters documentation
page as the list of 'Available Fields' for all resource types.

`$ evrythng-openapi-tools print filter-table`


### Print API Key Permissions List

Print the list of endpoints and which keys can access them as shown in the
_API Keys and Permissions_ page.

`$ evrythng-openapi-tools print $specFile keyPermissions`


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

#### Schema File

A file containing a single `schemas` object, which is the schema name. Example:

```
ThngDocument.yaml
```
