# XML-Sax

[![codecov](https://codecov.io/gh/TheDome/xmljs-sax/branch/develop/graph/badge.svg?token=BIEQR9H432)](https://codecov.io/gh/TheDome/xmljs-sax)
[![npm](https://img.shields.io/npm/v/saxxmlparser?color=red&label=version)](https://www.npmjs.com/package/saxxmlparser)
[![npm](https://img.shields.io/npm/dt/saxxmlparser)](https://www.npmjs.com/package/saxxmlparser)
[![GitHub commits since latest release (by SemVer)](https://img.shields.io/github/commits-since/thedome/xmljs-sax/latest)](https://github.com/TheDome/xmljs-sax/compare/master...develop)

A small package to transverse xml into javascript

## Example

### Parse.ts

```typescript
import { readFileSync } from "fs";
import parse from "saxxmlparser";

var xml = readFileSync("xml.xml");

parse(xml).then((node) => {
  var price = node.resolveNSPath(
    "A:envelope/A:body/B:getstockPriceResponsE/B:price",
    {
      A: "http://www.w3.org/2001/12/soap-envelope",
      B: "http://www.example.org/stock",
    }
  );
  console.log(price.value); // Prints 34.5
});
```

### xml.xml

```xml
<?xml version="1.0"?>
<soap:Envelope
xmlns:soap="http://www.w3.org/2001/12/soap-envelope"
soap:encodingStyle="http://www.w3.org/2001/12/soap-encoding">

  <soap:Body xmlns:m="http://www.example.org/stock">
    <m:GetStockPriceResponse>
      <m:Price>34.5</m:Price>
    </m:GetStockPriceResponse>
  </soap:Body>

</soap:Envelope>
```

## Usage

### resolving a specific child

```typescript
import { readFileSync } from "fs";
import parse from "saxxmlparser";

var xml = readFileSync("xml.xml");

parse(xml).then((node) => {
  var price = node.resolveNSPath(
    "A:envelope/A:body/B:getstockPriceResponsE/B:price", // Put the absolute path to the child in here
    {
      A: "http://www.w3.org/2001/12/soap-envelope",
      B: "http://www.example.org/stock",
    }
  );
  console.log(price.value); // Prints 34.5
});
```

### Resolving a child whose parents don't matter

Sometimes when you only want a specific child but the parents or the path does not matter

```typescript
import { readFileSync } from "fs";
import parse from "saxxmlparser";

var xml = readFileSync("xml.xml");

parse(xml).then((node) => {
  // A double slash (//) in front of the search triggers a child search
  var price = node.resolveNSPath(
    "//B:price", // Put the absolute path to the child in here
    {
      A: "http://www.w3.org/2001/12/soap-envelope",
      B: "http://www.example.org/stock",
    }
  );
  console.log(price.value); // Prints 34.5
});
```

### Resolving a child of a child whose parents don't matter

Sometimes when you only want a specific child but the parents or the path does not matter

```typescript
import { readFileSync } from "fs";
import parse from "saxxmlparser";

var xml = readFileSync("xml.xml");

parse(xml).then((node) => {
  // A double slash (//) in front of the search triggers a child search
  var price = node.resolveNSPath(
    "//B:GetStockPriceResponse/B:price", // Put the absolute path to the child in here
    {
      A: "http://www.w3.org/2001/12/soap-envelope",
      B: "http://www.example.org/stock",
    }
  );
  console.log(price.value); // Prints 34.5
});
```

## Functions

### Resolver

Parses the supplied xml and returns the root node
If strict is set to true, the sax parser will be instructed to use strict mode (defaults to true)

`parse(xml, strict = true): Promise<XmlNode>`
