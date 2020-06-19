import Debug from "debug";
import { QualifiedAttribute } from "sax";

export interface XmlAttribute {
  name: string;
  value: string;
  prefix: string;
  local: string;
  uri: string;
}

const debugNode = Debug("xml:node");
const debugResolver = Debug("xml:noderesolver");
export default class XmlNode {
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

  addChild(node: XmlNode): XmlNode {
    this.childs.push(node);
    node.parent = this;
    return this;
  }

  addAttribute(attr: QualifiedAttribute): XmlNode {
    if (attr.prefix === "xmlns") return;

    debugNode("Adding attribute: %O", attr);
    this.attributes.push(attr as XmlAttribute);
    return this;
  }

  setValue(text: string): XmlNode {
    debugNode("Value of %s is: %s", this.name, text);
    this.value = text;
    return this;
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
   * This function would look for nodes matching those arguments and return the node found under <code>C:root</code>
   * <br>
   *     Furthermore this is a breath first search. So the first child matching the criteria will be given back.
   * @param path The path.
   * @param ns Namespace arguments
   * @param ignoreCase ignore the case of the names
   */
  resolveNSPath(
    path: string,
    ns: Record<string, string>,
    ignoreCase = true
  ): Promise<XmlNode | null> {
    debugResolver(
      "Resolving childs for path: %s. ignoring case: %s, NS attributes are: %O",
      path,
      ignoreCase,
      ns
    );

    return Promise.resolve().then(() => {
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
        (ignoreCase
          ? this.name.toLocaleLowerCase() !== thisLocalName.toLocaleLowerCase()
          : this.name !== thisLocalName)
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
    });
  }
}
