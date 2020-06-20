A small package to transverse xml into javascript

## Example

### Parse.ts
```typescript
import { readFileSync } from "fs"
import parse from "./lib/index"

var xml = readFileSync("xml.xml")

parse(xml).then(node => {
    var price = node.resolveNSPath("A:envelope/A:body/B:getstockPriceResponsE/B:price",
                                   {
                                     A: "http://www.w3.org/2001/12/soap-envelope",
                                     B: "http://www.example.org/stock",
                                   }
                                 );
    console.log(price.value) // Prints 34.5
})
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
import { readFileSync } from "fs"
import parse from "./lib/index"

var xml = readFileSync("xml.xml")

parse(xml).then(node => {
    var price = node.resolveNSPath("A:envelope/A:body/B:getstockPriceResponsE/B:price", // Put the absolute path to the child in here
                                   {
                                     A: "http://www.w3.org/2001/12/soap-envelope",
                                     B: "http://www.example.org/stock",
                                   }
                                 );
    console.log(price.value) // Prints 34.5
})
```

### Resolving a child whose parents don't matter
Sometimes when you only want a specific child but the parents or the path does not matter
```typescript
import { readFileSync } from "fs"
import parse from "./lib/index"

var xml = readFileSync("xml.xml")

parse(xml).then(node => {
    // A double slash (//) in front of the search triggers a child search
    var price = node.resolveNSPath("//B:price", // Put the absolute path to the child in here
                                   {
                                     A: "http://www.w3.org/2001/12/soap-envelope",
                                     B: "http://www.example.org/stock",
                                   }
                                 );
    console.log(price.value) // Prints 34.5
})
```

### Resolving a child of a child whose parents don't matter
Sometimes when you only want a specific child but the parents or the path does not matter
```typescript
import { readFileSync } from "fs"
import parse from "./lib/index"

var xml = readFileSync("xml.xml")

parse(xml).then(node => {
    // A double slash (//) in front of the search triggers a child search
    var price = node.resolveNSPath("//B:GetStockPriceResponse/B:price", // Put the absolute path to the child in here
                                   {
                                     A: "http://www.w3.org/2001/12/soap-envelope",
                                     B: "http://www.example.org/stock",
                                   }
                                 );
    console.log(price.value) // Prints 34.5
})
```

## Functions
### Resolver 

Parses the supplied xml and returns the root node
parse(xml, namespaces, ignoreCase = true): Promise<XmlNode>