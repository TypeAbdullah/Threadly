import { Db, ObjectId } from "mongodb";
import { Domain, DomainStatus } from "@threadly/types";

export class DomainRepository {
  private db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  public async initIndexes(): Promise<void> {
    const col = this.db.collection("domains");
    await col.createIndex({ normalizedHostname: 1 }, { unique: true });
    await col.createIndex({ siteId: 1, createdAt: -1 });
    await col.createIndex({ siteId: 1, isPrimary: 1 });
    await col.createIndex({ status: 1 });
    await col.createIndex({ type: 1 });
    await col.createIndex({ providerHostnameId: 1 });
  }

  public async findByNormalizedHostname(normalizedHostname: string): Promise<Domain | null> {
    const doc = await this.db.collection("domains").findOne({
      normalizedHostname,
      status: { $ne: "deleted" },
    });
    return doc ? this.formatDoc(doc) : null;
  }

  public async findById(id: string): Promise<Domain | null> {
    try {
      const doc = await this.db.collection("domains").findOne({ _id: new ObjectId(id) });
      return doc ? this.formatDoc(doc) : null;
    } catch {
      return null;
    }
  }

  public async findBySiteId(siteId: string): Promise<Domain[]> {
    const docs = await this.db
      .collection("domains")
      .find({ siteId, status: { $ne: "deleted" } })
      .sort({ isPrimary: -1, createdAt: -1 })
      .toArray();
    return docs.map(this.formatDoc);
  }

  public async insert(domain: Omit<Domain, "id">): Promise<Domain> {
    const insertDoc: any = {
      ...domain,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await this.db.collection("domains").insertOne(insertDoc);
    insertDoc._id = result.insertedId;
    return this.formatDoc(insertDoc);
  }

  public async update(id: string, updates: Partial<Domain>): Promise<Domain | null> {
    const { id: _, ...fieldsToUpdate } = updates as any;
    fieldsToUpdate.updatedAt = new Date();

    const result = await this.db.collection("domains").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: fieldsToUpdate },
      { returnDocument: "after" }
    );

    return result ? this.formatDoc(result) : null;
  }

  public async setPrimary(siteId: string, domainId: string): Promise<void> {
    // 1. Unset any existing primary domain on this site
    await this.db.collection("domains").updateMany(
      { siteId, isPrimary: true },
      { $set: { isPrimary: false, updatedAt: new Date() } }
    );

    // 2. Set chosen domain as primary
    await this.db.collection("domains").updateOne(
      { _id: new ObjectId(domainId), siteId },
      { $set: { isPrimary: true, updatedAt: new Date() } }
    );
  }

  public async markDeleted(id: string): Promise<void> {
    await this.db.collection("domains").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: "deleted",
          deletedAt: new Date().toISOString(),
          updatedAt: new Date(),
        },
      }
    );
  }

  public async findAll(filter: {
    status?: DomainStatus;
    type?: string;
    search?: string;
    limit?: number;
    skip?: number;
  }): Promise<{ items: Domain[]; total: number }> {
    const query: any = { status: { $ne: "deleted" } };

    if (filter.status) query.status = filter.status;
    if (filter.type) query.type = filter.type;
    if (filter.search) {
      query.$or = [
        { hostname: { $regex: filter.search, $options: "i" } },
        { siteId: { $regex: filter.search, $options: "i" } },
      ];
    }

    const total = await this.db.collection("domains").countDocuments(query);
    const docs = await this.db
      .collection("domains")
      .find(query)
      .sort({ createdAt: -1 })
      .skip(filter.skip || 0)
      .limit(filter.limit || 50)
      .toArray();

    return {
      items: docs.map(this.formatDoc),
      total,
    };
  }

  private formatDoc(doc: any): Domain {
    return {
      id: doc._id.toString(),
      siteId: doc.siteId,
      hostname: doc.hostname,
      normalizedHostname: doc.normalizedHostname,
      type: doc.type,
      status: doc.status,
      isPrimary: Boolean(doc.isPrimary),
      provider: doc.provider || "cloudflare",
      providerHostnameId: doc.providerHostnameId,
      dnsRecords: doc.dnsRecords || [],
      verification: doc.verification,
      sslStatus: doc.sslStatus || "pending",
      errorDetails: doc.errorDetails,
      createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
      verifiedAt: doc.verifiedAt ? new Date(doc.verifiedAt).toISOString() : null,
      deletedAt: doc.deletedAt ? new Date(doc.deletedAt).toISOString() : null,
    };
  }
}
