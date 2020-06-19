import parse from "../lib";

describe("XMLParser", function () {
  it("should read a simple XML", async function () {
    const xml =
      '<?xml version="1.0"?>\n' +
      "<soap:Envelope\n" +
      'xmlns:soap="http://www.w3.org/2001/12/soap-envelope"\n' +
      'soap:encodingStyle="http://www.w3.org/2001/12/soap-encoding">\n' +
      "\n" +
      '  <soap:Body xmlns:m="http://www.example.org/stock">\n' +
      "    <m:GetStockPriceResponse>\n" +
      '      <m:Price includedVat="1.21">34.5</m:Price>\n' +
      "    </m:GetStockPriceResponse>\n" +
      "  </soap:Body>\n" +
      "\n" +
      "</soap:Envelope>";
    await expect(parse(xml)).resolves.toMatchSnapshot();
  });

  it("should read a complicated XML", async function () {
    const xml =
      '<?xml version="1.0"?>\n' +
      "<soap:Envelope\n" +
      'xmlns:soap="http://www.w3.org/2001/12/soap-envelope"\n' +
      'soap:encodingStyle="http://www.w3.org/2001/12/soap-encoding">\n' +
      "\n" +
      '  <soap:Body xmlns:m="http://www.example.org/stock">\n' +
      "    <m:GetStockPriceResponse>\n" +
      "      <m:Price>34.5</m:Price>\n" +
      "    </m:GetStockPriceResponse>\n" +
      "    <m:GetStockPriceResponse>\n" +
      "        <m:Price>35.5</m:Price>\n" +
      "        <m:priCe>36.5</m:priCe>\n" +
      "    </m:GetStockPriceResponse>\n" +
      "  </soap:Body>\n" +
      "\n" +
      "</soap:Envelope>";
    await expect(parse(xml)).resolves.toMatchSnapshot();
  });
});

describe("Resolver", function () {
  it("should resolve the path to a child", async function () {
    const xml =
      '<?xml version="1.0"?>\n' +
      "<soap:Envelope\n" +
      'xmlns:soap="http://www.w3.org/2001/12/soap-envelope"\n' +
      'soap:encodingStyle="http://www.w3.org/2001/12/soap-encoding">\n' +
      "\n" +
      '  <soap:Body xmlns:m="http://www.example.org/stock">\n' +
      "    <m:GetStockPriceResponse>\n" +
      '      <m:Price includedVat="1.21">34.5</m:Price>\n' +
      "    </m:GetStockPriceResponse>\n" +
      "  </soap:Body>\n" +
      "\n" +
      "</soap:Envelope>";

    const root = await parse(xml);

    const priceNode = root.resolveNSPath(
      "A:Envelope/A:Body/B:GetStockPriceResponse/B:Price",
      {
        A: "http://www.w3.org/2001/12/soap-envelope",
        B: "http://www.example.org/stock",
      }
    );

    expect(priceNode).not.toBeNull();
    expect(priceNode?.value).toEqual("34.5");
  });
});
