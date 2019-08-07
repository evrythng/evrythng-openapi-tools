# schemas

Contains JSON schema files enforcing some style guidelines to spec files - for
example, that each property has a `description` and `example` value.

Ensuring these style items are complied with makes documentation of requests
and schemas a _lot_ easier.


### `SchemaObject.schema.json`

Ensures that:

* Each `schemas` item has a `description` and `properties`.
* Each `properties` item has a `description`.
* Each `properties` item is either:
  * A `string`, `number`, `boolean`, or `object` type with a `description`.
  * An `array` type with either:
    * `items` with type `string`, `number`, or `boolean`.
    * `items` with `$ref`.


### `PathObject.schema.json`

Ensures that:

* Each object has a method one of `post`, `put`, `get`, or `delete`.
* Each operation has `summary`, `description`, `tags` (max 1), `x-api-keys`,
  and `responses`.
  * `x-api-keys` is some of `Operator`, `Application`, `Trusted Application`,
    `Application User`, or `Device`.
* If `parameters` are specified, they are objects referring to a `$ref`.
* Each `responses` object has:
  * A result code of `200`, `201`, `202`, `204`, `301`, `307`, `400`, `401`,
    `404`, `409`, or `500`.
  * A `description`.
  * If `content` is specified, it is of type `application/json` and contains:
    * A `schema` referrring to a `$ref`.
    * or a `schema` of type `array` where each of `items` refers to a `$ref`.
    * An `example`.
