import fs from 'fs';
import path from 'path';

// Storage file location
const DB_FILE = path.join(process.cwd(), 'src', 'db', 'db-data.json');

// Initialize local DB data with standard records to prevent an empty screen
function getInitialData() {
  const timestamp = Date.now();
  return {
    users: [
      {
        uid: 'default-admin',
        email: 'admin@communityhero.org',
        displayName: 'Lead Administrator',
        role: 'Admin',
        points: 1000,
        xp: 5000,
        level: 10,
        isVerified: 1,
        createdAt: timestamp,
        updatedAt: timestamp,
        bio: 'City Manager and Community Hero System Administrator.'
      },
      {
        uid: 'default-officer',
        email: 'officer@communityhero.org',
        displayName: 'Officer Sarah Jenkins',
        role: 'Officer',
        departmentId: 'dept-1',
        points: 500,
        xp: 2500,
        level: 5,
        isVerified: 1,
        createdAt: timestamp,
        updatedAt: timestamp,
        bio: 'Public Works Department Officer.'
      }
    ],
    issues: [
      {
        id: 'issue-1',
        title: 'Large Pothole on Elm Street',
        description: 'A deep and hazardous pothole right in the middle of the driving lane near 450 Elm St. Causing vehicles to swerve dangerously.',
        status: 'In Progress',
        category: 'Pothole',
        severity: 'High',
        lat: 377749, // Coordinates mapped to integer for schema uniformity
        lng: -1224194,
        address: '450 Elm St, San Francisco, CA',
        createdAt: timestamp - 3600000 * 24, // 1 day ago
        updatedAt: timestamp - 3600000 * 2,
        reporterId: 'default-admin',
        reporterName: 'Lead Administrator',
        upvotes: 12,
        departmentId: 'dept-1',
        assignedOfficerId: 'default-officer',
        assignedOfficerName: 'Officer Sarah Jenkins'
      },
      {
        id: 'issue-2',
        title: 'Major Water Leakage on Oak Avenue',
        description: 'Main water line seems to have ruptured. Clean water is bubbling up through the pavement and flooding the sidewalk.',
        status: 'Submitted',
        category: 'Water Leakage',
        severity: 'Critical',
        lat: 377849,
        lng: -1224094,
        address: '102 Oak Ave, San Francisco, CA',
        createdAt: timestamp - 3600000 * 4, // 4 hours ago
        updatedAt: timestamp - 3600000 * 4,
        reporterId: 'default-officer',
        reporterName: 'Officer Sarah Jenkins',
        upvotes: 8,
        departmentId: 'dept-1'
      }
    ],
    comments: [],
    audit_logs: [
      {
        id: 'log-1',
        issueId: 'issue-1',
        actorId: 'default-admin',
        actorName: 'Lead Administrator',
        action: 'Report Submitted',
        details: 'Issue reported: Large Pothole on Elm Street',
        createdAt: timestamp - 3600000 * 24
      }
    ],
    upvotes: [],
    posts: [
      {
        id: 'post-1',
        authorId: 'default-admin',
        author: 'Lead Administrator',
        role: 'Admin',
        avatar: 'L',
        content: 'Welcome everyone to the Community Hero platform! Use this space to stay updated, report hazards, and coordinate neighborhood improvement campaigns.',
        likes: 5,
        commentCount: 0,
        createdAt: timestamp - 3600000 * 12
      }
    ],
    post_comments: [],
    post_likes: [],
    announcements: [
      {
        id: 'ann-1',
        title: 'Upcoming Neighborhood Clean-up Drive',
        desc: 'Join us this Saturday at 9 AM in the Central Park parking lot for our bi-weekly volunteer clean-up drive. Grabbers and bags will be provided!',
        date: 'This Saturday, 9:00 AM',
        createdAt: timestamp - 3600000 * 48
      }
    ],
    notifications: []
  };
}

// Thread-safe read/write operations
function readData(): Record<string, any[]> {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialData();
      fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading mock DB data file:', error);
    return getInitialData();
  }
}

function writeData(data: Record<string, any[]>) {
  try {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing mock DB data file:', error);
  }
}

// Query operators mimicking drizzle-orm
export function eq(column: string, value: any) {
  return { type: 'eq', column, value };
}

export function and(...conditions: any[]) {
  return { type: 'and', conditions };
}

export function desc(column: string) {
  return { column, direction: 'desc' };
}

export function asc(column: string) {
  return { column, direction: 'asc' };
}

// Table objects mapping matching column names
export const users = {
  uid: 'uid',
  displayName: 'displayName',
  email: 'email',
  role: 'role',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  points: 'points',
  xp: 'xp',
  level: 'level',
  isVerified: 'isVerified',
  departmentId: 'departmentId',
  phone: 'phone',
  address: 'address',
  city: 'city',
  state: 'state',
  country: 'country',
  bio: 'bio',
  profilePhoto: 'profilePhoto',
  status: 'status',
  _tableName: 'users'
};

export const issues = {
  id: 'id',
  title: 'title',
  description: 'description',
  status: 'status',
  category: 'category',
  severity: 'severity',
  lat: 'lat',
  lng: 'lng',
  address: 'address',
  imageUrl: 'imageUrl',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  reporterId: 'reporterId',
  reporterName: 'reporterName',
  upvotes: 'upvotes',
  departmentId: 'departmentId',
  assignedOfficerId: 'assignedOfficerId',
  assignedOfficerName: 'assignedOfficerName',
  _tableName: 'issues'
};

export const comments = {
  id: 'id',
  issueId: 'issueId',
  userId: 'userId',
  userName: 'userName',
  text: 'text',
  createdAt: 'createdAt',
  _tableName: 'comments'
};

export const auditLogs = {
  id: 'id',
  issueId: 'issueId',
  actorId: 'actorId',
  actorName: 'actorName',
  action: 'action',
  details: 'details',
  createdAt: 'createdAt',
  _tableName: 'audit_logs'
};

export const upvotes = {
  id: 'id',
  issueId: 'issueId',
  userId: 'userId',
  createdAt: 'createdAt',
  _tableName: 'upvotes'
};

export const posts = {
  id: 'id',
  authorId: 'authorId',
  author: 'author',
  role: 'role',
  avatar: 'avatar',
  content: 'content',
  likes: 'likes',
  commentCount: 'commentCount',
  createdAt: 'createdAt',
  _tableName: 'posts'
};

export const postComments = {
  id: 'id',
  postId: 'postId',
  authorId: 'authorId',
  author: 'author',
  avatar: 'avatar',
  content: 'content',
  createdAt: 'createdAt',
  _tableName: 'post_comments'
};

export const postLikes = {
  id: 'id',
  postId: 'postId',
  userId: 'userId',
  createdAt: 'createdAt',
  _tableName: 'post_likes'
};

export const announcements = {
  id: 'id',
  title: 'title',
  desc: 'desc',
  date: 'date',
  createdAt: 'createdAt',
  _tableName: 'announcements'
};

export const notifications = {
  id: 'id',
  userId: 'userId',
  title: 'title',
  text: 'text',
  unread: 'unread',
  createdAt: 'createdAt',
  _tableName: 'notifications'
};

const TABLE_KEY_MAP: Record<string, string> = {
  'users': 'users',
  'issues': 'issues',
  'comments': 'comments',
  'audit_logs': 'audit_logs',
  'upvotes': 'upvotes',
  'posts': 'posts',
  'post_comments': 'post_comments',
  'post_likes': 'post_likes',
  'announcements': 'announcements',
  'notifications': 'notifications'
};

function matches(item: any, condition: any): boolean {
  if (!condition) return true;
  if (condition.type === 'eq') {
    return item[condition.column] === condition.value;
  }
  if (condition.type === 'and') {
    return condition.conditions.every((c: any) => matches(item, c));
  }
  return true;
}

class QueryBuilder {
  private tableName: string;
  private whereCondition: any = null;
  private limitCount: number | null = null;
  private orderByExpression: any = null;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  where(condition: any) {
    this.whereCondition = condition;
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  orderBy(expr: any) {
    this.orderByExpression = expr;
    return this;
  }

  async then(resolve: (value: any) => void, reject?: (reason: any) => void) {
    try {
      const data = readData();
      const dbKey = TABLE_KEY_MAP[this.tableName] || this.tableName;
      let list = data[dbKey] || [];

      if (this.whereCondition) {
        list = list.filter((item) => matches(item, this.whereCondition));
      }

      if (this.orderByExpression) {
        const { column, direction } = this.orderByExpression;
        list = [...list].sort((a, b) => {
          const valA = a[column];
          const valB = b[column];
          if (valA === valB) return 0;
          if (valA === undefined || valA === null) return 1;
          if (valB === undefined || valB === null) return -1;

          if (direction === 'desc') {
            return valA < valB ? 1 : -1;
          } else {
            return valA > valB ? 1 : -1;
          }
        });
      }

      if (this.limitCount !== null) {
        list = list.slice(0, this.limitCount);
      }

      resolve(list);
    } catch (e) {
      if (reject) reject(e);
      else console.error(e);
    }
  }
}

class InsertBuilder {
  private tableName: string;
  private insertValues: any;
  private onConflictDoUpdateConfig: any = null;

  constructor(tableName: string, values: any) {
    this.tableName = tableName;
    this.insertValues = values;
  }

  onConflictDoUpdate(config: any) {
    this.onConflictDoUpdateConfig = config;
    return this;
  }

  returning() {
    return this;
  }

  async then(resolve: (value: any) => void, reject?: (reason: any) => void) {
    try {
      const data = readData();
      const dbKey = TABLE_KEY_MAP[this.tableName] || this.tableName;
      const list = data[dbKey] || [];

      const valuesToInsert = Array.isArray(this.insertValues) ? this.insertValues : [this.insertValues];
      const insertedItems: any[] = [];

      for (const val of valuesToInsert) {
        let index = -1;
        if (this.onConflictDoUpdateConfig) {
          const targetCol = this.onConflictDoUpdateConfig.target;
          index = list.findIndex((item: any) => item[targetCol] === val[targetCol]);
        } else {
          const pkCol = this.tableName === 'users' ? 'uid' : 'id';
          if (val[pkCol]) {
            index = list.findIndex((item: any) => item[pkCol] === val[pkCol]);
          }
        }

        if (index !== -1) {
          const setValues = this.onConflictDoUpdateConfig ? this.onConflictDoUpdateConfig.set : val;
          list[index] = { ...list[index], ...setValues, updatedAt: Date.now() };
          insertedItems.push(list[index]);
        } else {
          const newItem = { ...val };
          if (newItem.createdAt === undefined) newItem.createdAt = Date.now();
          if (newItem.updatedAt === undefined) newItem.updatedAt = Date.now();
          list.push(newItem);
          insertedItems.push(newItem);
        }
      }

      data[dbKey] = list;
      writeData(data);

      resolve(insertedItems);
    } catch (e) {
      if (reject) reject(e);
      else console.error(e);
    }
  }
}

class UpdateBuilder {
  private tableName: string;
  private setValues: any;
  private whereCondition: any = null;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  set(values: any) {
    this.setValues = values;
    return this;
  }

  where(condition: any) {
    this.whereCondition = condition;
    return this;
  }

  async then(resolve: (value: any) => void, reject?: (reason: any) => void) {
    try {
      const data = readData();
      const dbKey = TABLE_KEY_MAP[this.tableName] || this.tableName;
      const list = data[dbKey] || [];

      const updatedItems: any[] = [];
      for (let i = 0; i < list.length; i++) {
        const matchesCondition = !this.whereCondition || matches(list[i], this.whereCondition);
        console.log('DEBUG: Updating item:', list[i].id, 'matches:', matchesCondition);
        if (matchesCondition) {
          list[i] = { ...list[i], ...this.setValues, updatedAt: Date.now() };
          updatedItems.push(list[i]);
        }
      }

      data[dbKey] = list;
      writeData(data);

      resolve(updatedItems);
    } catch (e) {
      if (reject) reject(e);
      else console.error(e);
    }
  }
}

class DeleteBuilder {
  private tableName: string;
  private whereCondition: any = null;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  where(condition: any) {
    this.whereCondition = condition;
    return this;
  }

  async then(resolve: (value: any) => void, reject?: (reason: any) => void) {
    try {
      const data = readData();
      const dbKey = TABLE_KEY_MAP[this.tableName] || this.tableName;
      const list = data[dbKey] || [];

      const remaining: any[] = [];
      const deleted: any[] = [];

      for (const item of list) {
        if (!this.whereCondition || matches(item, this.whereCondition)) {
          deleted.push(item);
        } else {
          remaining.push(item);
        }
      }

      data[dbKey] = remaining;
      writeData(data);

      resolve({ success: true, count: deleted.length });
    } catch (e) {
      if (reject) reject(e);
      else console.error(e);
    }
  }
}

export const db = {
  select() {
    return {
      from(tableObj: any) {
        const tableName = typeof tableObj === 'string' ? tableObj : tableObj._tableName;
        return new QueryBuilder(tableName);
      }
    };
  },
  insert(tableObj: any) {
    const tableName = typeof tableObj === 'string' ? tableObj : tableObj._tableName;
    return {
      values(values: any) {
        return new InsertBuilder(tableName, values);
      }
    };
  },
  update(tableObj: any) {
    const tableName = typeof tableObj === 'string' ? tableObj : tableObj._tableName;
    return new UpdateBuilder(tableName);
  },
  delete(tableObj: any) {
    const tableName = typeof tableObj === 'string' ? tableObj : tableObj._tableName;
    return new DeleteBuilder(tableName);
  }
};
