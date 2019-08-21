# schemas

Contains JSON schema files enforcing some style guidelines to spec files - for
example, that each property has a `description` and `example` value.

Ensuring these style items are complied with makes documentation of requests
and schemas a _lot_ easier.


### `SchemaObject.schema.json`

Requires that:

* Each `schemas` item has a `description`.
* Each `properties` item has a `description`.
* Each `properties` item is either:
  * A `$ref`
  * A `string`, `number`, `boolean`, or `object` type with a `description`.
  * An `array` type with `description` and either:
    * `items` with `type` `string`, `number`, or `boolean`.
    * `items` with `$ref`.

Note: `type` is not required for `properties` items to cater for generic object
fields that may be any type, such as `customFields`.


### `PathObject.schema.json`

Requires that:

* Each property is a method, one of `post`, `put`, `get`, or `delete`.
* Each operation has `summary`, `description`, `tags` (max 1), `x-api-keys`,
  and `responses`.
  * `x-api-keys` is some of `Operator`, `Application`, `Trusted Application`,
    `Application User`, or `Device`.
* If `parameters` are specified, they are objects referring to a `$ref`.
* If `requestBody` is specified, it is of type `content.application/json` and:
  * That media type contains both `schema` and `example`.
  * The `schema` referrring to a `$ref`.
* Each `responses` object has:
  * A `description`.
  * A result code of `200`, `201`, `202`, `204`, `301`, `307`, `400`, `401`,
    `404`, `409`, `415`, or `500`.
  * If `content` is specified, it is of type `application/json` and contains:
    * A `schema` referrring to a `$ref`
    * OR a `schema` of type `array` where each of `items` refers to:
      * A `$ref`.
      * OR a basic `type`.
    * An `example`.
