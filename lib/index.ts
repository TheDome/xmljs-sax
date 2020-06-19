import { parser as saxParser, QualifiedAttribute } from "sax";
import Debug from "debug";

export default function parse(xml: string, strict = true): Promise<XmlNode> {
  const debug = Debug("xml:parser");

  return new Promise<XmlNode>((resolve, reject) => {
    const parser = saxParser(strict, { xmlns: true });
    let root: XmlNode;
    let current: XmlNode;
    const stack: XmlNode[] = [];
    let currentAttrs: XmlAttribute[] = [];

    parser.onopentag = (tag) => {
      debug('Tag opened "%s": %O', tag.name, tag);

      const node = new XmlNode(
        "local" in tag ? tag.local : tag.name,
        tag.name,
        "ns" in tag ? tag.ns : undefined
      );

      for (const key in tag.attributes) {
        debug("Iterating over attr: %O", key);
        let attr = tag.attributes[key];
        if (typeof attr !== "string") {
          // is a qualified attribute
          attr = attr as QualifiedAttribute;

          node.addAttribute(attr);
        } else {
          debug("Could not parse attr: %s", attr);
        }
      }

      currentAttrs = [];
      if (!root) {
        root = node;
      } else {
        current.addChild(node);
      }
      // Store the current node
      current = node;
      stack.push(node);
    };

    parser.onclosetag = () => {
      // Node is finished
      const tag = stack.pop();
      if (tag) {
        debug("Tag %s closed", tag.name);
      } else {
        debug("Tag closed: undefined");
      }
    };

    parser.onattribute = (attr) => {
      debug("Attribute found: %s=%s", attr.name, attr.value);
      if ("local" in attr) {
        currentAttrs.push(attr as XmlAttribute);
      } else {
        debug("Could not parse attr: %O", attr);
      }
    };

    parser.onend = () => {
      debug("Parser finished parsing!");
      resolve(root);
    };

    parser.ontext = (t) => {
      debug("Received text: %s", t);
      if (current && t && t.trim().length !== 0) {
        current.setValue(t);
      }
    };

    parser.onerror = (e) => {
      debug("Parser encountered error: %O", e);
      reject(e);
    };

    parser.write(xml).end();
  });
}

interface XmlAttribute {
  name: string;
  value: string;
  prefix: string;
  local: string;
  uri: string;
}

const debugNode = Debug("xml:node");
const debugResolver = Debug("xml:noderesolver");
class XmlNode {
  public readonly name: string;
  private namespace: Record<string, string> = {};
  public readonly attributes: XmlAttribute[] = [];
  private fullName: string;

  public readonly childs: XmlNode[] = [];
  public value: string | undefined;
  /**
   * A link to the parent node. Null, if this is the root of the tree
   */
  private _parent: XmlNode | null = null;

  constructor(
    name: string,
    qualifiedName: string,
    namespace?: Record<string, string>
  ) {
    this.name = name;
    this.fullName = qualifiedName;

    if (namespace) {
      Object.keys(namespace).forEach((v) => {
        this.namespace[v] = namespace[v];
      });
    }
  }

  addChild(node: XmlNode) {
    this.childs.push(node);
    node.parent = this;
  }

  addAttribute(attr: QualifiedAttribute) {
    if (attr.prefix === "xmlns") return;

    debugNode("Adding attribute: %O", attr);
    this.attributes.push(attr as XmlAttribute);
  }

  setValue(text: string) {
    debugNode("Value of %s is: %s", this.name, text);
    this.value = text;
  }

  set parent(parent: XmlNode) {
    this._parent = parent;
    this.namespace = Object.assign(this.namespace, parent.namespace);
  }
  /**
   * Resolve the path of a child node an return the Node
   *
   * An example would be:
   * <br>
   * <code>
   * resolveNSPath("A:root/B:xml/C:root", {
   *     A: "exampleNS1",
   *     B: "exampleNS2",
   *     C: "exampleNS3",
   * })
   * </code>
   * This function would look for nodes matchin thos arguments and return the node found under <code>C:root</code>
   * <br>
   * @param path The path.
   * @param ns Namespace arguments
   * @param ignoreCase ignore the case of the names
   */
  resolveNSPath(
    path: string,
    ns: Record<string, string>,
    ignoreCase = true
  ): XmlNode | null {
    debugResolver(
      "Resolving childs for path: %s. ignoring case: %s, NS attributes are: %O",
      path,
      ignoreCase,
      ns
    );

    // Strip out current node
    const indexForNext = path.indexOf("/");
    const thisName = path.substring(0, indexForNext);
    const thisNameSpace = thisName.split(":")[0];
    const thisLocalName = thisName.split(":")[1];
    const childPath = path.substring(indexForNext + 1);
    const nextChild = childPath.substring(0, childPath.indexOf("/"));

    debugResolver("ThisNode: %s", thisName);

    if (
      ns[thisNameSpace] !== this.namespace[this.fullName.split(":")[0]] ||
      this.name !== thisLocalName
    ) {
      if (nextChild.length === 0) {
        // This is the searched one!
        return this;
      }
      debugResolver("LocalName: %s - search: %s", this.name, thisLocalName);
      debugResolver(
        "NameSpace: %s - search: %s",
        this.namespace[this.fullName.split(":")[0]],
        ns[thisNameSpace]
      );
      debugResolver("Names don't match. Returning...");
      return null;
    }

    debugResolver("Resolving childs: %s", childPath);
    debugResolver("Next child is: %s", nextChild);

    for (const c of this.childs) {
      const r = c.resolveNSPath(childPath, ns, ignoreCase);
      if (r) {
        return r;
      }
    }

    return null;
  }
}
