import {
  CLANS,
  ensureLeaderboardDocs,
  subscribeLeaderboard,
  recordPooledBalls as dbRecordPooledBalls,
  recordMatchResult as dbRecordMatchResult,
  loginPlayer
} from './core.js';

// ══════════════════════════════
//  CONSTANTS
// ══════════════════════════════
const BASE_W=720, BASE_H=400;
const RAIL=42;
const PX=RAIL,PY=RAIL,PW=BASE_W-RAIL*2,PH=BASE_H-RAIL*2;
const R=11, PR=19;
const FRICTION=0.9875, MIN_VEL=0.09, MAX_SHOT=21;
const TURN_SEC=60, QUIZ_SEC=30;

const BCOLORS=['#f5f5f5','#f7c400','#1040d0','#cc1111','#770077',
               '#dd5500','#117711','#8b0000','#111111',
               '#f7c400','#1040d0','#cc1111','#770077','#dd5500','#117711','#8b0000'];

const POCKETS=[
  {x:RAIL-1,      y:RAIL-1},
  {x:BASE_W/2,    y:RAIL-7},
  {x:BASE_W-RAIL+1,y:RAIL-1},
  {x:RAIL-1,      y:BASE_H-RAIL+1},
  {x:BASE_W/2,    y:BASE_H-RAIL+7},
  {x:BASE_W-RAIL+1,y:BASE_H-RAIL+1},
];

const QUESTION_BANK = {
  'App Developer': [
    { q: 'In Flutter, which language is used to build apps?', opts: ['Swift', 'Kotlin', 'TypeScript', 'Dart'], correct: 3 },
    { q: 'Which Android lifecycle callback runs first for an Activity?', opts: ['onCreate', 'onResume', 'onLoad', 'onAttach'], correct: 0 },
    { q: 'React Native primarily renders with:', opts: ['Canvas only', 'DOM elements', 'WebView only', 'Native UI components'], correct: 3 },
    { q: 'SwiftUI is mainly for:', opts: ['3D modeling', 'Cloud deployment', 'iOS UI declarations', 'Database indexing'], correct: 2 },
    { q: 'Which tool is used to profile performance and memory leaks in iOS apps?', opts: ['Instruments', 'Xdebug', 'Gradle', 'Logcat'], correct: 0 },
    { q: 'What layout paradigm does Jetpack Compose use?', opts: ['Absolute constraints', 'Declarative UI components', 'Imperative XML', 'Flexbox grid'], correct: 1 },
    { q: 'In Flutter, widgets that do not maintain internal state are called:', opts: ['StatelessWidget', 'StatefulWidget', 'InheritedWidget', 'Provider'], correct: 0 },
    { q: 'What is the primary language used for native Android development currently recommended by Google?', opts: ['Java', 'C++', 'Kotlin', 'Scala'], correct: 2 },
    { q: 'In iOS development, ARC stands for:', opts: ['Automatic Reference Counting', 'Advanced Resource Compiler', 'Async Request Controller', 'App Realtime Core'], correct: 0 },
    { q: 'Which package manager is native to the iOS ecosystem for managing Swift dependencies?', opts: ['NPM', 'Swift Package Manager', 'CocoaPods', 'Gradle'], correct: 1 },
    { q: 'What component acts as the bridge between JavaScript and native modules in older React Native architectures?', opts: ['The Bridge', 'The Metro Bundler', 'The Flexbox engine', 'The Virtual DOM'], correct: 0 },
    { q: 'In Android, which file defines application permissions and core components?', opts: ['build.gradle', 'AndroidManifest.xml', 'MainActivity.kt', 'settings.gradle'], correct: 1 },
    { q: 'What Flutter feature allows developers to see code changes instantly without restarting the app?', opts: ['Hot Reload', 'Cold Boot', 'Just-In-Time Compilation', 'Ahead-Of-Time Build'], correct: 0 },
    { q: 'Which design pattern is highly promoted by Apple for SwiftUI applications?', opts: ['MVC', 'MVVM', 'Singleton', 'Repository'], correct: 1 },
    { q: 'What is the default layout engine used across React Native apps for positioning components?', opts: ['Grid Layout', 'Flexbox', 'Absolute Layout Manager', 'Constraint Layout'], correct: 1 },
    { q: 'Which mobile app architecture pattern strictly separates Model, View, and ViewModel to make UI logic testable?', opts: ['MVVM', 'Singleton Pattern', 'Observer Pattern', 'Factory Pattern'], correct: 0 },
    { q: 'What technique lets a mobile app run smoothly by deferring heavy work off the main UI thread?', opts: ['Background/Async Processing', 'Hot Reloading', 'AOT Compilation', 'Widget Tree Diffing'], correct: 0 }
  ],
  'Web Developer': [
    { q: 'Which HTML element is semantic for top navigation?', opts: ['div', 'nav', 'main', 'aside'], correct: 1 },
    { q: 'Which CSS layout model is two-dimensional?', opts: ['Flexbox', 'Grid', 'Float', 'Inline-block'], correct: 1 },
    { q: 'JSON.parse is used to:', opts: ['Serialize objects', 'Parse JSON text', 'Minify CSS', 'Validate HTML'], correct: 1 },
    { q: 'HTTP 404 indicates:', opts: ['Unauthorized', 'Created', 'Not Found', 'Conflict'], correct: 2 },
    { q: 'Which HTML5 element provides a programmatic canvas for rendering 2D shapes and bitmap graphics?', opts: ['<svg>', '<canvas>', '<picture>', '<graphics>'], correct: 1 },
    { q: 'What CSS property controls the layout stacking order of overlapping elements?', opts: ['z-index', 'opacity', 'display', 'position'], correct: 0 },
    { q: 'Which JavaScript method creates a new array populated with the results of calling a function on every element?', opts: ['forEach()', 'filter()', 'map()', 'reduce()'], correct: 2 },
    { q: 'What does the browser mechanism CORS stand for?', opts: ['Cross-Origin Resource Sharing', 'Core Object Routing System', 'Client Only Resource Secure', 'Certified Origin Request Standard'], correct: 0 },
    { q: 'Which HTTP status code corresponds to a "Bad Request"?', opts: ['401', '403', '400', '500'], correct: 2 },
    { q: 'What is the purpose of the Alt attribute inside an image tag?', opts: ['Specify image width', 'Provide descriptive alternative text for accessibility', 'Apply specific CSS filter styles', 'Cache the image locally'], correct: 1 },
    { q: 'Which JavaScript keyword is used to declare variables scoped to the immediate block, preventing hoisting issues?', opts: ['var', 'let', 'global', 'define'], correct: 1 },
    { q: 'What concept explains JavaScript executing asynchronous tasks via queues when the execution stack clears?', opts: ['The Event Loop', 'The Thread Pool Engine', 'Hoisting Registry', 'Callback Bubble Cascade'], correct: 0 },
    { q: 'What CSS units are relative to the font-size of the root element (HTML)?', opts: ['em', 'rem', 'px', 'vh'], correct: 1 },
    { q: 'Which API lets web applications store key-value pairs locally across browser sessions with no expiration?', opts: ['SessionStorage', 'LocalStorage', 'IndexedDB', 'CookieStore'], correct: 1 },
    { q: 'What is the primary purpose of a Web Worker in modern JavaScript?', opts: ['To run scripts in background threads without blocking the main UI thread', 'To intercept and cache network requests globally', 'To optimize search engine indexing pipelines', 'To encrypt local asset storage caches'], correct: 0 }
  ],
  'Game Developer': [
    { q: 'A typical game loop order is:', opts: ['Render, Input, Update', 'Input, Update, Render', 'Update, Render, Input', 'Input, Render, Save'], correct: 1 },
    { q: 'Unity scripting is usually written in:', opts: ['Lua', 'Python', 'C#', 'Rust'], correct: 2 },
    { q: 'Delta time helps with:', opts: ['Frame-rate independent movement', 'Texture compression', 'Shader linking', 'Save files'], correct: 0 },
    { q: 'Collision broad phase often uses:', opts: ['Spatial partitioning', 'Audio mixing', 'Font kerning', 'DNS caching'], correct: 0 },
    { q: 'Which matrix converts coordinates from 3D world space into camera view space?', opts: ['Projection Matrix', 'View Matrix', 'Model Matrix', 'Translation Matrix'], correct: 1 },
    { q: 'What optimization technique stops rendering objects hidden behind other solid geometry from the view camera?', opts: ['Occlusion Culling', 'Frustum Clipping', 'Mipmapping', 'LOD Scaling'], correct: 0 },
    { q: 'What component evaluates physics behaviors and physical forces on an object inside the Unity Engine?', opts: ['Transform Component', 'Rigidbody', 'Mesh Filter', 'Collider 3D Instance'], correct: 1 },
    { q: 'Which pattern decouples object invocation from actual runtime instantiations, reusing disabled objects in memory pools?', opts: ['Object Pooling Pattern', 'Observer Pattern', 'State Pattern Model', 'Singleton Controller'], correct: 0 },
    { q: 'What mathematical construct is heavily used in game development to prevent gimbal lock when calculating rotations?', opts: ['Euler Angles', 'Quaternions', 'Cross Products', 'Identity Matrices'], correct: 1 },
    { q: 'What does a vertex shader handle inside a standard programmable graphics pipeline?', opts: ['Calculating final pixel color values', 'Processing individual vertices and computing their positions', 'Setting camera aspect ratio values', 'Generating particle textures'], correct: 1 },
    { q: 'What game development concept involves automatically lowering 3D model complexity based on camera distance?', opts: ['Level of Detail (LOD)', 'Normal Mapping', 'Baking Textures', 'Anti-Aliasing'], correct: 0 },
    { q: 'Which structure is used in navigation algorithms to define walkable surfaces for game characters?', opts: ['NavMesh', 'Spatial Hash Table', 'Octree Array', 'BSP Tree Node'], correct: 0 },
    { q: 'What does a fragment shader (pixel shader) compute in rendering graphics?', opts: ['The visual pixel attributes like color and depth', 'The vertex transformations', 'Physics vector fields', 'Audio panning filters'], correct: 0 },
    { q: 'What algorithm is universally used for shortest pathfinding in strategic tile games?', opts: ['A* Search Algorithm', 'Bubble Sort Algorithm', 'Binary Tree Traversal', 'Run-Length Encoding'], correct: 0 },
    { q: 'What graphics rendering technique generates multiple smaller versions of a texture to optimize distant lookups?', opts: ['Mipmapping', 'Anisotropic Filtering', 'Normal Mapping Extraction', 'Skybox Layouts'], correct: 0 },
    { q: 'What technique blends multiple animation clips together smoothly to avoid jarring transitions between character states?', opts: ['Animation Blending', 'Keyframe Baking', 'Rigging', 'Skinning'], correct: 0 },
    { q: 'Which data structure is commonly used to efficiently organize and query large 2D/3D worlds for collision and rendering?', opts: ['Spatial Partitioning Tree (Quadtree/Octree)', 'Linked List', 'Hash Map', 'Stack'], correct: 0 }
  ],
  'Full Stack': [
    { q: 'A full stack app typically includes:', opts: ['Frontend only', 'Backend only', 'Frontend + Backend + DB', 'Static HTML only'], correct: 2 },
    { q: 'Which HTTP verb usually updates a resource?', opts: ['PUT', 'TRACE', 'HEAD', 'LINK'], correct: 0 },
    { q: 'JWT is commonly used for:', opts: ['Authentication tokens', 'Image optimization', 'Video streaming', 'DNS resolution'], correct: 0 },
    { q: 'An ORM is used for:', opts: ['Relational data mapping', 'Audio processing', 'GPU scheduling', 'Email routing'], correct: 0 },
    { q: 'Which data architecture model structures tables with strict relationships, using primary and foreign keys?', opts: ['Relational Database (RDBMS)', 'Document NoSQL Store', 'Graph Database Node Map', 'Key-Value Cache Storage'], correct: 0 },
    { q: 'What architectural design pattern relies entirely on message queues to trigger operations asynchronously across isolated backends?', opts: ['Event-Driven Architecture', 'Monolithic MVC Schema', 'Client-Server Static Mapping', 'Layered SOA Pipeline'], correct: 0 },
    { q: 'Which software suite acts as an intermediate reverse proxy server protecting applications and managing load distribution?', opts: ['Nginx', 'Docker Desktop', 'MongoDB Compass', 'Redis CLI Engine'], correct: 0 },
    { q: 'What is the standard data exchange format universally passed between decoupled microservices?', opts: ['JSON', 'CSV Document Arrays', 'TOML Strings', 'YAML Multi-documents'], correct: 0 },
    { q: 'What technique keeps an active application database completely distinct from high-load reporting tasks to minimize locks?', opts: ['Read/Write Replica Splitting', 'Database Index Deletion', 'Horizontal Table Sharding', 'In-Memory Cache Busting'], correct: 0 },
    { q: 'What concept describes an application handling thousands of concurrent network transactions without blocking backend processing threads?', opts: ['Asynchronous Non-Blocking I/O', 'Multi-Threaded Preemptive Locks', 'Distributed Cluster Sharding', 'Synchronous Thread Pool Allocation'], correct: 0 },
    { q: 'Which protocol utilizes a single continuous TCP connection to push real-time full-duplex data streams instantly between client and server?', opts: ['WebSockets', 'HTTP/1.1 REST Pipelines', 'GraphQL Query Operations', 'gRPC Unary Call Architecture'], correct: 0 },
    { q: 'What mechanism validates a clients identity using an encrypted token structure without checking persistent session states on a database?', opts: ['Stateless Token Authentication', 'Stateful Session Store Lookups', 'Basic Auth Header Decoding', 'OAuth2 Code Grand Authorization'], correct: 0 },
    { q: 'What caching methodology stores specific heavy query returns in high-speed RAM layer applications like Redis?', opts: ['In-Memory Data Caching', 'Browser Cache Partitioning', 'Edge Network Content Delivery', 'Database View Index Materialization'], correct: 0 },
    { q: 'What data pattern relies on nesting collections of documents inside unique records rather than referencing foreign rows?', opts: ['NoSQL Document Schema', 'Third Normal Form normalization', 'Graph Relationship Linking', 'Star Schema Data Warehousing'], correct: 0 },
    { q: 'Which HTTP method is specifically intended to apply partial modifications to an existing server resource?', opts: ['PATCH', 'PUT', 'POST', 'OPTIONS'], correct: 0 },
    { q: 'Server-side rendering mainly helps with:', opts: ['SEO and first paint', 'Disk encryption', 'Ping speed', 'Compiler size'], correct: 0 },
    { q: 'Request payload validation belongs in:', opts: ['Schema/controller layer', 'Image CDN', 'Font file', 'DNS resolver'], correct: 0 },
    { q: 'State management on frontend improves:', opts: ['UI data consistency', 'CPU temperature', 'Cable throughput', 'Kernel mode'], correct: 0 },
    { q: 'Typical production architecture:', opts: ['Client talks directly to DB', 'App server + database', 'Only browser cache', 'Only CLI scripts'], correct: 1 },
    { q: 'What security strategy implements defensive checks across every isolated abstraction point in a modern application?', opts: ['Defense in Depth', 'Perimeter Network Isolation', 'Role-Based Authorization Caps', 'Static Code Encryption Matrices'], correct: 0 },
    { q: 'What database engineering process involves slicing dataset rows horizontally across distinct server node clusters?', opts: ['Sharding', 'Normalization', 'Indexing optimization', 'Cascading deletion'], correct: 0 },
    { q: 'Which design mechanism allows the frontend to fetch precisely the structured properties requested without server-side over-fetching?', opts: ['GraphQL Schema Engine', 'RESTful Resource Controller', 'SOAP XML API endpoints', 'gRPC Protocol Buffers'], correct: 0 },
    { q: 'What frontend approach breaks standard user interface design down into small, encapsulated, autonomous deployment blocks?', opts: ['Micro-frontends', 'Monolithic Single Page Apps', 'Static Site Generators', 'Serverless SSR Frameworks'], correct: 0 },
    { q: 'What issue occurs when a software developer makes multiple backend calls sequentially instead of resolving them in an optimized joined query?', opts: ['The N+1 Query Problem', 'Memory Leak Profiling', 'Race Condition Conflicts', 'Deadlock Table Scans'], correct: 0 },
    { q: 'What container technology packages up web code, software runtimes, and local assets to ensure uniform execution environment behavior?', opts: ['Docker Containers', 'Virtual Machine Hypervisors', 'Serverless Functions Lambdas', 'Systemd Daemons Tasks'], correct: 0 },
    { q: 'What caching standard uses a distributed network of edge nodes to deliver static app assets globally with low latency?', opts: ['Content Delivery Network (CDN)', 'Browser Cache Policies', 'Reverse Proxy Engine Array', 'Distributed Memory Cache Cluster'], correct: 0 },
    { q: 'What software strategy uses automated configuration scripts to provision virtual server environments identical to production models?', opts: ['Infrastructure as Code (IaC)', 'Continuous Integration (CI)', 'Automated End-to-End Testing', 'GitOps Lifecycle Management'], correct: 0 },
    { q: 'What is the main advantage of deploying an application across an automated Serverless cloud environment architecture?', opts: ['Automatic scale-to-zero and usage-based scaling properties', 'Persistent background worker tasks running indefinitely', 'Complete manual root control over the operating system kernel', 'Eliminating the need to write backend API endpoints completely'], correct: 0 },
    { q: 'What strategy mitigates high traffic spikes crashing backend database connection pools directly?', opts: ['Connection Pooling and Request Throttling', 'Dropping heavy index references', 'Enabling browser service workers', 'Minifying application JavaScript packages'], correct: 0 },
    { q: 'What mechanism allows continuous user interface interactions to persist across asynchronous page switches without full reloading?', opts: ['Single Page Application (SPA) Routing', 'Server-Side Rendering (SSR)', 'Multi-Page Document Lifecycle', 'Edge Network Asset Hydration'], correct: 0 },
    { q: 'What is the primary purpose of an API Gateway sitting in front of a cluster of backend microservices?', opts: ['Routing, auth, and rate-limiting requests in one place', 'Compiling frontend JavaScript bundles', 'Storing user session cookies permanently', 'Rendering server-side HTML templates'], correct: 0 }
  ],
  'Cybersecurity': [
    { q: 'SQL injection targets:', opts: ['SQL query construction', 'CSS styles', 'Audio buffers', 'GPU shaders'], correct: 0 },
    { q: 'MFA stands for:', opts: ['Multi-Factor Authentication', 'Main Firewall Access', 'Memory Fault Audit', 'Manual File Auth'], correct: 0 },
    { q: 'HTTPS provides:', opts: ['Encrypted transport', 'Unlimited bandwidth', 'Lower latency always', 'Free hosting'], correct: 0 },
    { q: 'Least privilege means:', opts: ['Grant minimum access needed', 'Grant admin to all', 'Disable logging', 'Share root accounts'], correct: 0 },
    { q: 'What modern security paradigm treats every access request as untrusted, requiring continuous identity validation?', opts: ['Zero Trust Architecture', 'Perimeter Network Security Model', 'Role-Based Authentication Access', 'Demilitarized Zone Partitioning'], correct: 0 },
    { q: 'What vulnerability involves an attacker injecting malicious scripts into trusted websites to execute on clients browsers?', opts: ['Cross-Site Scripting (XSS)', 'Cross-Site Request Forgery (CSRF)', 'SQL Injection (SQLi)', 'Server-Side Request Forgery (SSRF)'], correct: 0 },
    { q: 'Which cryptographic algorithm relies on distinct pairs of public and private keys to secure communications?', opts: ['Asymmetric Encryption', 'Symmetric Key Ciphers', 'Hashing Algorithms', 'Salting Operations'], correct: 0 },
    { q: 'What attack vector sends an overwhelming torrent of internet traffic to exhaust a targets infrastructure resources completely?', opts: ['Distributed Denial of Service (DDoS)', 'Man-in-the-Middle (MitM) Exploit', 'Brute-Force Authorization Guessing', 'Phishing E-mail Campaigns'], correct: 0 },
    { q: 'What security process alters readable plaintext data into unreadable ciphertext that only authorized keys can decrypt?', opts: ['Encryption', 'Hashing transformation', 'Obfuscation techniques', 'Salting parameters'], correct: 0 },
    { q: 'What design vulnerability allows an exploit to trick a backend server into routing unexpected requests to internal third-party resources?', opts: ['Server-Side Request Forgery (SSRF)', 'Cross-Site Request Forgery (CSRF)', 'Remote Code Execution (RCE)', 'Directory Traversal Exploit'], correct: 0 },
    { q: 'What defense mechanism protects passwords against precomputed dictionary lookups (rainbow tables) before they are hashed?', opts: ['Salting', 'Symmetric padding', 'Tokenization', 'Bit shifting'], correct: 0 },
    { q: 'Which specialized security mechanism sits between an internal application and the internet to filter out malicious web-based payloads?', opts: ['Web Application Firewall (WAF)', 'Intrusion Detection System (IDS)', 'Virtual Private Network (VPN)', 'Network Address Translation (NAT) router'], correct: 0 },
    { q: 'What standard authorization framework permits applications to secure third-party account delegation without disclosing passwords?', opts: ['OAuth 2.0 Framework', 'JWT Token Standard', 'SAML Identity Management', 'Basic Access Authentication'], correct: 0 },
    { q: 'What specific security vulnerability involves an attacker exploiting a state timing difference between software checks and asset execution?', opts: ['Time-of-Check to Time-of-Use (TOCTOU)', 'Buffer Overflow Condition', 'Integer Overflow Bug', 'Null Pointer Dereference'], correct: 0 },
    { q: 'What framework is widely recognized as a comprehensive global matrix charting real-world cyber adversary tactics and techniques?', opts: ['MITRE ATT&CK Matrix', 'OWASP Top 10 List', 'NIST Cybersecurity Guidelines', 'ISO 27001 standard compliance'], correct: 0 },
    { q: 'What security practice involves simulating real attacks against a system, with permission, to uncover exploitable weaknesses?', opts: ['Penetration Testing', 'Static Code Linting', 'Load Testing', 'Unit Testing'], correct: 0 },
    { q: 'Which principle states a system should keep functioning correctly even after a single component fails, avoiding one point of total failure?', opts: ['Fail-Safe Design / No Single Point of Failure', 'Zero Trust Networking', 'Least Privilege Access', 'Defense in Depth'], correct: 0 }
  ],
  'UI & UX Designer': [
    { q: 'Wireframes are primarily for:', opts: ['Layout planning', 'Runtime debugging', 'Database migrations', 'TLS setup'], correct: 0 },
    { q: 'Good UX emphasizes:', opts: ['User clarity and goals', 'Maximum animation', 'Hidden controls', 'Random navigation'], correct: 0 },
    { q: 'High color contrast is key for:', opts: ['Accessibility', 'CPU optimization', 'Packet routing', 'Build speed'], correct: 0 },
    { q: 'A prototype is used to:', opts: ['Test interaction flow', 'Compile code', 'Run unit tests', 'Provision cloud VMs'], correct: 0 },
    { q: 'What design rule states that users spend most of their time on other sites, meaning they expect your site to operate similarly?', opts: ['Jakob’s Law', 'Fitts’s Law', 'Hick’s Law', 'Miller’s Law'], correct: 0 },
    { q: 'What tool maps out the entire sequence of phases a consumer goes through when interfacing with a digital product?', opts: ['User Journey Map', 'Information Architecture Diagram', 'Site Map Layout Tree', 'Low-Fidelity Wireframe Blueprint'], correct: 0 },
    { q: 'Which design concept establishes structural importance by varying sizes, fonts, contrasts, and positions of UI elements?', opts: ['Visual Hierarchy', 'Responsive Layout System', 'Design Token Management', 'Skeuomorphic Art Direction'], correct: 0 },
    { q: 'What is the purpose of conducting usability testing phases during UX design?', opts: ['To validate and refine product flows by observing real user friction points', 'To optimize database request throughput times', 'To write functional end-to-end component integration scripts', 'To establish server-side deployment pipeline variables'], correct: 0 },
    { q: 'What concept describes visual properties of an element that hint or suggest how a user can interact with it?', opts: ['Affordances', 'Signifiers', 'Gestalt principles', 'Micro-interactions'], correct: 0 },
    { q: 'What system defines reusable design guidelines, UI components, and design tokens to maintain visual harmony across products?', opts: ['Design System', 'Wireframe Matrix', 'Mood Board Layout', 'Style Guide Sheet'], correct: 0 },
    { q: 'What UX design law models the time required to make a decision increasing logarithmically with the number and complexity of choices?', opts: ['Hick’s Law', 'Fitts’s Law', 'Miller’s Law', 'The Pareto Principle'], correct: 0 },
    { q: 'What approach organizes digital layouts to ensure content automatically refactors smoothly across mobile, tablet, and desktop viewports?', opts: ['Responsive Web Design', 'Adaptive Framework Layouts', 'Grid Alignment Paradigms', 'Fluid Container Models'], correct: 0 },
    { q: 'What design philosophy models interface components around real-world objects, textures, and physical interactive behaviors?', opts: ['Skeuomorphism', 'Flat Design', 'Material UI Design Standard', 'Minimalist Art Direction'], correct: 0 },
    { q: 'What design rule defines that the time to acquire a target is a function of the distance to and size of the target?', opts: ['Fitts’s Law', 'Jakob’s Law', 'Gestalt Continuity Principle', 'Law of Common Region'], correct: 0 },
    { q: 'What metric measures the degree of ease and efficiency with which a new user can successfully complete tasks inside a product UI?', opts: ['Usability Index', 'Conversion Optimization Factor', 'Task Completion Speed Ratio', 'System Accessibility Score'], correct: 0 },
    { q: 'What set of grouping principles (proximity, similarity, closure) describes how the human eye naturally perceives visual elements as unified wholes?', opts: ['Gestalt Principles', 'Fitts’s Law', 'Jakob’s Law', 'Hick’s Law'], correct: 0 },
    { q: 'What testing method shows two versions of a design to different user groups to measure which performs better against a goal?', opts: ['A/B Testing', 'Heuristic Evaluation', 'Card Sorting', 'Tree Testing'], correct: 0 }
  ],
  'Data Scientist': [
    { q: 'Pandas is commonly used for:', opts: ['Data manipulation', 'GPU overclocking', 'Kernel hooks', 'Package signing'], correct: 0 },
    { q: 'Median means:', opts: ['Middle value', 'Most frequent value', 'Largest value', 'Sum of values'], correct: 0 },
    { q: 'Overfitting occurs when model:', opts: ['Memorizes training noise', 'Cannot train at all', 'Underfits strongly', 'Has no data'], correct: 0 },
    { q: 'Confusion matrix evaluates:', opts: ['Classification performance', 'Storage throughput', 'Compiler speed', 'Web animations'], correct: 0 },
    { q: 'What mathematical metric evaluates the average magnitude of prediction errors without considering their directional sign?', opts: ['Mean Absolute Error (MAE)', 'Root Mean Squared Error (RMSE)', 'R-Squared Score Variance', 'Logarithmic Loss Index'], correct: 0 },
    { q: 'Which programming language is predominantly utilized for intensive statistical computing, data analysis, and modeling?', opts: ['Python', 'Java', 'C++', 'Go'], correct: 0 },
    { q: 'What feature extraction methodology reduces the dimensionality of massive datasets while retaining maximum original variance information?', opts: ['Principal Component Analysis (PCA)', 'Linear Regression Modeling', 'K-Means Cluster Optimization', 'Gradient Descent Minimization'], correct: 0 },
    { q: 'What core issue occurs when an experimental machine learning algorithm performs exceptionally well on training subsets but fails to generalize on new pools?', opts: ['High Variance (Overfitting)', 'High Bias (Underfitting)', 'Data Leakage anomalies', 'Stochastic Convergence Lag'], correct: 0 },
    { q: 'Which machine learning technique groups unlabeled data into distinct clusters based on shared feature similarities?', opts: ['Unsupervised Learning', 'Supervised Classification', 'Reinforcement Learning Policy', 'Semi-supervised Labeling'], correct: 0 },
    { q: 'What core data processing practice ensures individual numeric features share a uniform scale to prevent optimization skew?', opts: ['Feature Scaling (Normalization/Standardization)', 'One-Hot Vector Encoding', 'Missing Value Imputation', 'Data Augmentation Transformation'], correct: 0 },
    { q: 'What cross-validation method splits a dataset into equal partitions sequentially to ensure every sample serves as a test observation?', opts: ['K-Fold Cross-Validation', 'Random Subsample Partitioning', 'Stratified Split Allocation', 'Bootstrapping Iteration Models'], correct: 0 },
    { q: 'What mathematical theorem calculates the posterior probability of an event given prior knowledge of conditions related to that event?', opts: ['Bayes’ Theorem', 'Central Limit Theorem', 'Law of Large Numbers', 'Chebyshev’s Inequality'], correct: 0 },
    { q: 'What metric evaluates a classifications capability to correctly identify all relevant positive instances out of the total true positive count?', opts: ['Recall (Sensitivity)', 'Precision (Positive Predictive Value)', 'Accuracy Index', 'F1-Score Matrix'], correct: 0 },
    { q: 'What structural mistake happens when target variables from test datasets accidentally leak into training matrices during preprocessing?', opts: ['Data Leakage', 'Feature Selection Bias', 'Overfitting Artifacts', 'Stochastic Noise Injection'], correct: 0 },
    { q: 'What fundamental probability distribution displays a symmetrical, bell-shaped curve centered around its statistical mean value?', opts: ['Normal (Gaussian) Distribution', 'Binomial Probability Structure', 'Poisson Counting Distribution', 'Exponential Decay Matrix'], correct: 0 },
    { q: 'What resampling technique repeatedly draws samples with replacement from a dataset to estimate a statistic’s variability?', opts: ['Bootstrapping', 'K-Fold Cross-Validation', 'Stratified Sampling', 'Feature Scaling'], correct: 0 },
    { q: 'Which chart type is best suited to visualizing the relationship and correlation between two continuous numeric variables?', opts: ['Scatter Plot', 'Bar Chart', 'Pie Chart', 'Histogram'], correct: 0 },
    { q: 'What term describes a dataset where one class vastly outnumbers another, often skewing a classifier toward the majority class?', opts: ['Class Imbalance', 'Data Leakage', 'Multicollinearity', 'Heteroscedasticity'], correct: 0 }
  ],
  'AI & ML Engineer': [
    { q: 'Gradient descent is used to:', opts: ['Minimize loss', 'Encrypt traffic', 'Render frames', 'Build APIs'], correct: 0 },
    { q: 'Train/validation split helps:', opts: ['Estimate generalization', 'Increase RAM', 'Avoid labels', 'Skip testing'], correct: 0 },
    { q: 'A neuron output usually passes through:', opts: ['Activation function', 'CSV parser', 'Packet filter', 'Hash table'], correct: 0 },
    { q: 'PyTorch and TensorFlow are:', opts: ['ML frameworks', 'Relational databases', 'Web servers', 'IDEs'], correct: 0 },
    { q: 'Which activation function outputs values constrained exactly between 0 and 1, mapping directly to probabilities?', opts: ['Sigmoid Function', 'Rectified Linear Unit (ReLU)', 'Hyperbolic Tangent (Tanh)', 'Softmax Layer Controller'], correct: 0 },
    { q: 'What issue causes training gradients to decay exponentially as they propagate backward through deep neural networks?', opts: ['Vanishing Gradient Problem', 'Exploding Gradient Surge', 'Overfitting Convergence Trap', 'Dead ReLU Node Isolation'], correct: 0 },
    { q: 'What deep learning network architecture uses self-attention mechanisms to process sequence operations in parallel?', opts: ['Transformer Architecture', 'Recurrent Neural Network (RNN)', 'Convolutional Neural Network (CNN)', 'Generative Adversarial Network (GAN)'], correct: 0 },
    { q: 'Which regularizing process randomly deactivates selected neuron nodes during training cycles to combat dependency issues?', opts: ['Dropout Layer Regularization', 'L2 Ridge Weight Penalization', 'Batch Normalization Rescaling', 'Early Stopping Execution'], correct: 0 },
    { q: 'What architectural neural layer is optimized for spatial image processing and feature mapping operations?', opts: ['Convolutional Layer (CNN)', 'Long Short-Term Memory (LSTM) Block', 'Fully Connected Dense Layer', 'Embedding Layer Mapping'], correct: 0 },
    { q: 'What algorithm propagates computed loss errors backward through network layers to adjust individual weights?', opts: ['Backpropagation', 'Stochastic Forward Step', 'Principal Component Splitting', 'K-Nearest Neighbor Search'], correct: 0 },
    { q: 'What structural issue happens when an optimization function bounces back and forth across a loss valley due to an excessively large learning rate parameter?', opts: ['Oscillation/Divergence due to High Learning Rate', 'Vanishing Gradient Latency', 'Local Minima Trapped State', 'Overfitting Parameter Explosion'], correct: 0 },
    { q: 'Which specialized system trains two competing networks—a Generator and a Discriminator—against each other?', opts: ['Generative Adversarial Network (GAN)', 'Autoencoder Compression Model', 'Deep Q-Learning Network (DQN)', 'Transformer Attention Architecture'], correct: 0 },
    { q: 'What optimization technique updates neural weights using the gradient computed from a tiny, randomized subset of the dataset rather than the whole pool?', opts: ['Stochastic Gradient Descent (SGD)', 'Batch Gradient Processing', 'Levenberg-Marquardt Solver', 'Newton-Raphson Optimization'], correct: 0 },
    { q: 'What parameter regulates how aggressively an optimization algorithm shifts weights relative to the computed error gradient?', opts: ['Learning Rate', 'Batch Size Coefficient', 'Epoch Counter', 'Momentum Decay Variable'], correct: 0 },
    { q: 'What technique uses a pre-trained model on a large dataset as a starting point for a task on a smaller dataset?', opts: ['Transfer Learning', 'Data Augmentation', 'Hyperparameter Tuning', 'Reinforcement Learning'], correct: 0 },
    { q: 'What technique artificially expands a training dataset by applying transformations like rotation, flipping, or cropping to existing samples?', opts: ['Data Augmentation', 'Transfer Learning', 'Feature Scaling', 'Dropout Regularization'], correct: 0 },
    { q: 'Which output-layer function converts a vector of raw scores into a probability distribution across multiple classes summing to 1?', opts: ['Softmax Function', 'Sigmoid Function', 'ReLU Function', 'Tanh Function'], correct: 0 },
    { q: 'What machine learning paradigm trains an agent to take actions in an environment to maximize cumulative reward over time?', opts: ['Reinforcement Learning', 'Supervised Learning', 'Unsupervised Clustering', 'Semi-Supervised Learning'], correct: 0 }
  ],
  'Cloud Engineer': [
    { q: 'Kubernetes is for:', opts: ['Container orchestration', 'Photo editing', 'Spreadsheet formulas', 'Desktop theming'], correct: 0 },
    { q: 'Terraform is an example of:', opts: ['Infrastructure as Code', 'Video codec', 'SQL driver', 'UI toolkit'], correct: 0 },
    { q: 'Object storage service example:', opts: ['S3', 'VPC', 'EC2', 'IAM'], correct: 0 },
    { q: 'Auto-scaling allows:', opts: ['Dynamic resource adjustment', 'Forced reboot every hour', 'No monitoring', 'No load balancing'], correct: 0 },
    { q: 'Which isolation mechanism partitions virtual networks in a cloud environment to protect computing instances?', opts: ['Virtual Private Cloud (VPC)', 'Identity & Access Management (IAM)', 'Content Delivery Network (CDN)', 'Domain Name System (DNS) Hub'], correct: 0 },
    { q: 'What cloud model provides virtualized computing assets, networks, and storage components over the internet on demand?', opts: ['Infrastructure as a Service (IaaS)', 'Platform as a Service (PaaS)', 'Software as a Service (SaaS)', 'Function as a Service (FaaS)'], correct: 0 },
    { q: 'Which cloud feature monitors resource usage metrics and automatically adds server capacity during high demand?', opts: ['Auto-scaling', 'Load Balancing', 'Content Delivery Caching', 'Horizontal Sharding Engine'], correct: 0 },
    { q: 'What system routes incoming application traffic evenly across multiple backend server instances to prevent bottlenecks?', opts: ['Load Balancer', 'Reverse Proxy Gateway', 'Network Address Translator', 'API Gateway Router'], correct: 0 },
    { q: 'Which security principle isolates granular user actions using least-privilege control matrices across cloud platforms?', opts: ['Identity and Access Management (IAM)', 'Virtual Private Cloud (VPC)', 'Security Group Rules', 'Network Access Control Lists (NACLs)'], correct: 0 },
    { q: 'What strategy stores critical cloud data assets across distinct physical geographic datacenters to ensure disaster recovery options?', opts: ['Multi-Region Replication', 'Availability Zone Partitioning', 'Local Edge Caching Systems', 'Storage Area Network Sharding'], correct: 0 },
    { q: 'What architecture model builds backends around short-lived, event-triggered function assets, avoiding persistent server runtimes?', opts: ['Serverless (FaaS)', 'Microservices Monolith Container', 'Service Oriented Architecture', 'Decoupled Virtual Machine Clusters'], correct: 0 },
    { q: 'What virtual security barrier filters incoming network traffic for specific cloud computing instances?', opts: ['Security Groups', 'Network Address Translators', 'Internet Gateways', 'Route Tables'], correct: 0 },
    { q: 'What approach lets developers configure hardware infrastructure using structured text files like YAML or JSON?', opts: ['Infrastructure as Code (IaC)', 'Continuous Deployment (CD)', 'Configuration Management Scripts', 'Container Orchestration Policies'], correct: 0 },
    { q: 'What concept describes a cloud setup that combines local private infrastructure with public cloud resources?', opts: ['Hybrid Cloud', 'Multi-Cloud Architecture', 'Community Cloud Platform', 'Distributed Edge Network'], correct: 0 },
    { q: 'What type of cloud storage is optimized for archiving infrequently accessed compliance logs at minimal cost?', opts: ['Cold Storage (e.g., Glacier)', 'Block Storage Volumes', 'In-Memory Cache Layers', 'Distributed File Systems'], correct: 0 }
  ],
  'DevOps': [
    { q: 'CI/CD means:', opts: ['Continuous Integration/Continuous Delivery', 'Code Inspect/Code Deploy', 'Container Init/Container Destroy', 'Cloud Install/Cloud Debug'], correct: 0 },
    { q: 'Docker is mainly used for:', opts: ['Containerization', 'Spreadsheet editing', 'Audio recording', 'DNS hosting'], correct: 0 },
    { q: 'Monitoring helps by:', opts: ['Detecting issues early', 'Removing logs', 'Reducing testing to zero', 'Disabling alerts'], correct: 0 },
    { q: 'A pipeline should be:', opts: ['Automated and repeatable', 'Manual and random', 'Run once only', 'Unavailable on weekends'], correct: 0 },
    { q: 'What technology allows isolating applications at the operating system level, using shared kernels instead of full hypervisors?', opts: ['Containerization (e.g., Docker)', 'Virtual Machine Hypervisors', 'Serverless execution runtimes', 'Chroot Jail Environments'], correct: 0 },
    { q: 'What framework automates merging developer code changes into a main branch while running tests?', opts: ['Continuous Integration (CI)', 'Continuous Delivery (CD)', 'Git Trunk-Based Branching', 'Infrastructure Provisioning'], correct: 0 },
    { q: 'Which open-source system coordinates, schedules, and manages containerized applications at scale?', opts: ['Kubernetes', 'Docker Swarm Instance', 'Apache Web Server', 'Terraform Engine Core'], correct: 0 },
    { q: 'What deployment strategy replaces old application versions with new ones gradually to minimize downtime?', opts: ['Rolling Deployment', 'Blue-Green Environment Swapping', 'Canary Traffic Partitioning', 'Recreate Strategy Reset'], correct: 0 },
    { q: 'What strategy uses Git repositories as the single source of truth for managing infrastructure and application configurations?', opts: ['GitOps', 'ChatOps Infrastructure Management', 'Agile Lifecycle Delivery', 'DevSecOps Core Auditing'], correct: 0 },
    { q: 'What deployment approach keeps two identical production environments active, switching traffic to update systems with zero downtime?', opts: ['Blue-Green Deployment', 'Canary Release Testing', 'Rolling Update Lifecycle', 'Shadow Traffic Analysis'], correct: 0 },
    { q: 'What tool tracks metrics like CPU load and error rates to alert operations teams about performance drops?', opts: ['Monitoring and Alerting Systems (e.g., Prometheus)', 'Centralized Log Aggregators', 'Distributed Tracing Frameworks', 'Continuous Integration Runners'], correct: 0 },
    { q: 'What concept ensures an automation script produces the exact same infrastructure state regardless of how many times it runs?', opts: ['Idempotence', 'Immutability Factor', 'Determinism Optimization', 'Concurrency Control Matrix'], correct: 0 },
    { q: 'What methodology integrates automated security checks directly into the continuous integration and deployment pipeline?', opts: ['DevSecOps', 'GitOps Lifecycle Management', 'Site Reliability Engineering', 'Agile Scrum Delivery Model'], correct: 0 },
    { q: 'What practices focus on software reliability, system availability, and managing infrastructure operations using software engineering principles?', opts: ['Site Reliability Engineering (SRE)', 'Continuous Delivery Management', 'Systems Administration Support', 'Agile Development Frameworks'], correct: 0 },
    { q: 'What logs capture chronological events across distributed systems to help diagnose production errors?', opts: ['Application and System Logs', 'Network Packet Captures', 'Database Index Metrics', 'Git Commit History Files'], correct: 0 }
  ],
  'Embedded System': [
    { q: 'Firmware is:', opts: ['Software stored on device', 'A cloud API', 'A CSS file', 'A database engine'], correct: 0 },
    { q: 'UART is a:', opts: ['Serial communication protocol', 'UI framework', 'Neural architecture', 'Image format'], correct: 0 },
    { q: 'Microcontroller usually contains:', opts: ['CPU + memory + peripherals', 'Only SSD', 'Only GPU', 'Only display'], correct: 0 },
    { q: 'Real-time systems require:', opts: ['Timing guarantees', 'No interrupts', 'No clocks', 'No I/O'], correct: 0 },
    { q: 'What type of operating system relies on deterministic scheduling to guarantee tasks execute within precise time constraints?', opts: ['Real-Time Operating System (RTOS)', 'General Purpose OS (Linux/Windows)', 'Monolithic Kernel Architecture', 'Distributed Network OS Engine'], correct: 0 },
    { q: 'Which integrated circuit combines a processor core, memory, and programmable input/output peripherals onto a single chip?', opts: ['Microcontroller (MCU)', 'Central Processing Unit (CPU)', 'Application-Specific Integrated Circuit (ASIC)', 'Field Programmable Gate Array (FPGA)'], correct: 0 },
    { q: 'What asynchronous serial protocol uses two wires (TX and RX) to exchange data between two hardware devices?', opts: ['UART', 'SPI Communication Bus', 'I2C Multi-Master Protocol', 'CAN Bus Network'], correct: 0 },
    { q: 'What low-level hardware line triggers the CPU to pause execution and handle urgent real-time external events?', opts: ['Interrupt Request (IRQ) Line', 'System Clock Cycle Pulse', 'Direct Memory Access Channel', 'General Purpose I/O Pin'], correct: 0 },
    { q: 'Which synchronous serial bus protocol uses a master-slave configuration with four wires, including explicit chip-select lines?', opts: ['SPI (Serial Peripheral Interface)', 'I2C Communication Bus', 'UART Serial Link', 'RS-232 Industrial Standard'], correct: 0 },
    { q: 'What hardware timer automatically resets the microcontroller if the application hangs or becomes unresponsive?', opts: ['Watchdog Timer (WDT)', 'Real-Time Clock (RTC)', 'PWM Waveform Generator', 'Core System Tick Counter'], correct: 0 },
    { q: 'Which two-wire serial interface uses open-drain lines with pull-up resistors to connect multiple master and slave devices?', opts: ['I2C (Inter-Integrated Circuit)', 'SPI Bus Standard', 'UART Point-to-Point Link', '1-Wire Protocol Interface'], correct: 0 },
    { q: 'What mechanism allows peripheral hardware to transfer data directly to system memory without involving the CPU?', opts: ['Direct Memory Access (DMA)', 'Interrupt-Driven I/O Transfer', 'Polled Register Scanning', 'Memory-Mapped I/O Allocation'], correct: 0 },
    { q: 'What hardware module outputs variable-width pulses to control components like motors or dimmers?', opts: ['Pulse-Width Modulation (PWM)', 'Analog-to-Digital Converter (ADC)', 'Digital-to-Analog Converter (DAC)', 'Phase-Locked Loop (PLL) Clock'], correct: 0 },
    { q: 'What hardware module converts continuous analog voltage signals into discrete digital numbers for a microcontroller?', opts: ['Analog-to-Digital Converter (ADC)', 'Digital-to-Analog Converter (DAC)', 'Comparator Operational Amplifier', 'Voltage Regulator Circuit'], correct: 0 },
    { q: 'What specialized non-volatile memory stores firmware assets that remain intact even when the device loses power?', opts: ['Flash Memory', 'SRAM Volatile Registers', 'DRAM System Memory', 'Cache Memory Levels'], correct: 0 }
  ],
  'IoT': [
    { q: 'MQTT is used for:', opts: ['Lightweight pub/sub messaging', 'Video rendering', 'SQL tuning', 'Kernel patching'], correct: 0 },
    { q: 'Edge computing means:', opts: ['Processing near data source', 'Cloud-only processing', 'No networking', 'No storage'], correct: 0 },
    { q: 'IoT devices often rely on:', opts: ['Sensors and actuators', 'Desktop GPUs', 'Tape drives', 'Optical discs'], correct: 0 },
    { q: 'Common IoT risk:', opts: ['Weak default credentials', 'Too many CSS files', 'Large monitor size', 'Fast keyboard'], correct: 0 },
    { q: 'What lightweight network protocol uses a publish/subscribe model to exchange telemetry data in low-bandwidth IoT environments?', opts: ['MQTT Protocol', 'HTTP/1.1 REST Framework', 'CoAP Request-Response', 'AMQP Enterprise Queues'], correct: 0 },
    { q: 'What system design processes sensor data locally on near-field hardware instead of routing all telemetry to distant cloud datacenters?', opts: ['Edge Computing Architecture', 'Centralized Cloud Processing', 'Monolithic Server Architectures', 'Thin-Client Network Routing'], correct: 0 },
    { q: 'What low-power, long-range wireless protocol connects battery-operated IoT sensors across miles in wide-area networks?', opts: ['LoRaWAN', 'Wi-Fi 6 high-bandwidth standard', 'Bluetooth Low Energy (BLE) piconet', 'Zigbee Local Mesh Architecture'], correct: 0 },
    { q: 'What component converts physical properties into digital signals, and what component translates electrical signals back into physical movement?', opts: ['Sensors and Actuators', 'Microcontrollers and Radios', 'Transistors and Relays', 'Inverters and Transformers'], correct: 0 },
    { q: 'What serious security vulnerability often leaves deployments open to botnet takeovers like Mirai?', opts: ['Using weak default administrative credentials', 'Deploying dense CSS files', 'Using high resolution view monitors', 'Using fast mechanical keyboards'], correct: 0 },
    { q: 'What system uses virtual representations of live field assets to monitor performance metrics and simulate faults remotely?', opts: ['Digital Twin Models', 'Shadow device configuration state profiles', 'Predictive modeling arrays', 'Time Series telemetry graphing'], correct: 0 },
    { q: 'What vulnerability stems from field hardware configurations failing to isolate firmware assets against reverse engineering?', opts: ['Unencrypted Local Storage Extraction', 'DDoS reflection target vulnerabilities', 'Man-in-the-Middle network exploits', 'Brute-force auth vulnerabilities'], correct: 2 },
    { q: 'What database design is optimized to handle high-velocity sensor data streams based on chronological sequences?', opts: ['Time-Series Database (TSDB)', 'Graph structural database instances', 'Relational SQL Database setups', 'Document NoSQL frameworks'], correct: 0 },
    { q: 'What communication component standardizes protocol translation between local industrial mesh fields and public cloud dashboards?', opts: ['IoT Edge Gateway engine', 'Network Hub hardware routers', 'Reverse Proxy systems', 'NAT routing instances'], correct: 0 },
    { q: 'What lightweight, UDP-based protocol is designed for constrained IoT devices needing REST-like request/response semantics?', opts: ['CoAP (Constrained Application Protocol)', 'MQTT Pub/Sub', 'FTP File Transfer', 'SMTP Mail Relay'], correct: 0 }
  ]
};

function normDomain(domain) {
  const key = domain.trim().toLowerCase();
  const map = {
    'full stack developer': 'Full Stack',
    'full stack': 'Full Stack',
    'cyber security': 'Cybersecurity',
    'cybersecurity': 'Cybersecurity',
    'ui& ux designer': 'UI & UX Designer',
    'ui & ux designer': 'UI & UX Designer',
    'data scientist': 'Data Scientist',
    'ai & ml engineer': 'AI & ML Engineer',
    'app developer': 'App Developer',
    'web developer': 'Web Developer',
    'game developer': 'Game Developer',
    'devops': 'DevOps',
    'embedded system': 'Embedded System',
    'iot': 'IoT',
    'cloud engineer': 'Cloud Engineer'
  };
  return map[key] || domain;
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makeDomainDeck(domain, cycle) {
  const src = QUESTION_BANK[domain] || QUESTION_BANK['Full Stack'];
  const prompts = ['Quick Check', 'Challenge', 'Code Review', 'Sprint Task', 'Concept Drill', 'Expert Mode'];
  // Deck length = the domain's actual unique question count (no modulo
  // wraparound), so a question never repeats within one shuffled cycle.
  // A question CAN still appear for a different clan sharing this same
  // domain — that's expected/fine, only WITHIN one clan's session is a
  // repeat avoided. Once every unique question has been used, a fresh
  // cycle reshuffles the same pool for the next round.
  const deck = src.map((base, i) => {
    const correctOpt = base.opts[base.correct];
    const opts = shuffle(base.opts);
    return {
      id: `${domain}-${cycle}-${i}`,
      domain,
      q: `${prompts[(cycle + i) % prompts.length]} ${i + 1}: ${base.q}`,
      opts,
      correct: opts.indexOf(correctOpt)
    };
  });
  return shuffle(deck);
}

const urlClan = new URLSearchParams(window.location.search).get('clan');
let activeClanKey = CLANS[urlClan] ? urlClan : null;
let activeClan = activeClanKey ? CLANS[activeClanKey] : null;
let opponentClanKey = null;
let opponentClan = null;

const quizState = {
  domainOrder: [],
  domainPointer: 0,
  deckByDomain: {},
  cycleByDomain: {}
};

let activeQuizQuestion = null;

function createEmptyClanStats() {
  return { games: 0, wins: 0, losses: 0, playerPooled: 0, cpuPooled: 0, totalPooled: 0 };
}

// ── Leaderboard now lives in Firestore (leaderboard/{clanKey}) so every
//    device/laptop reads and writes the SAME shared data. `leaderboard`
//    below is just a local cache kept in sync in real time via
//    subscribeLeaderboard()'s onSnapshot listeners — it starts empty
//    and fills in as soon as Firestore responds. ──
const leaderboard = {};
for (const key of Object.keys(CLANS)) leaderboard[key] = createEmptyClanStats();

let fbReady = false;
let fbError = null;

ensureLeaderboardDocs()
  .then(() => {
    fbReady = true;
    subscribeLeaderboard((clanKey, data) => {
      leaderboard[clanKey] = data;
      renderAdminPortal();
    });
  })
  .catch((err) => {
    fbError = err;
    console.error('Firestore leaderboard unavailable, falling back to local-only stats:', err);
  });

const matchPooled = { player: [], cpu: [] };

function resetMatchPooled() {
  matchPooled.player = [];
  matchPooled.cpu = [];
}

function renderTube(targetId, ids) {
  const el = document.getElementById(targetId);
  el.innerHTML = '';
  ids.forEach((id) => {
    const b = document.createElement('span');
    b.className = 'tube-ball';
    b.style.background = BCOLORS[id] || '#ffffff';
    if (id >= 9 && id <= 15) {
      b.style.background = '#f4f4f4';
      b.style.border = `2px solid ${BCOLORS[id]}`;
    }
    el.appendChild(b);
  });
}

function renderAdminPortal() {
  document.getElementById('admin-current').textContent = activeClan ? `${activeClan.badge} ${activeClan.name}` : '-';
  document.getElementById('admin-opp').textContent = opponentClan ? `${opponentClan.badge} ${opponentClan.name}` : '-';
  document.getElementById('admin-player-pool').textContent = String(matchPooled.player.length);
  document.getElementById('admin-cpu-pool').textContent = String(matchPooled.cpu.length);

  const body = document.getElementById('admin-body');
  body.innerHTML = '';

  Object.entries(CLANS).forEach(([key, clan]) => {
    const stat = leaderboard[key] || createEmptyClanStats();
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${clan.badge} ${clan.name}</td>
      <td>${stat.games}</td>
      <td>${stat.wins}</td>
      <td>${stat.losses}</td>
      <td>${stat.playerPooled}</td>
      <td>${stat.cpuPooled}</td>
      <td>${stat.totalPooled}</td>
    `;
    body.appendChild(row);
  });

  renderTube('tube-player', matchPooled.player);
  renderTube('tube-cpu', matchPooled.cpu);
}

function openAdminPortal() {
  renderAdminPortal();
  document.getElementById('adminov').classList.add('show');
}

function closeAdminPortal() {
  document.getElementById('adminov').classList.remove('show');
}

function recordPooledBalls(actor, ballIds) {
  if (!activeClanKey || !ballIds.length) return;

  // Local optimistic update so the in-match tube/admin view feels instant;
  // the Firestore onSnapshot listener will reconcile it with the real value.
  const stat = leaderboard[activeClanKey] || createEmptyClanStats();
  if (actor === 0) {
    stat.playerPooled += ballIds.length;
    matchPooled.player.push(...ballIds);
  } else {
    stat.cpuPooled += ballIds.length;
    matchPooled.cpu.push(...ballIds);
  }
  stat.totalPooled += ballIds.length;
  leaderboard[activeClanKey] = stat;

  dbRecordPooledBalls(activeClanKey, actor, ballIds.length).catch((err) => {
    console.error('Failed to sync pooled balls to Firestore:', err);
  });
}

function recordMatchResult(playerWon) {
  if (!activeClanKey) return;

  // Local optimistic update; Firestore snapshot reconciles the real count.
  const stat = leaderboard[activeClanKey] || createEmptyClanStats();
  stat.games += 1;
  if (playerWon) stat.wins += 1; else stat.losses += 1;
  leaderboard[activeClanKey] = stat;

  dbRecordMatchResult(activeClanKey, playerWon).catch((err) => {
    console.error('Failed to sync match result to Firestore:', err);
  });
}

function ensureQuizDecks() {
  if (!activeClan) return;
  const domains = activeClan.domains.map(normDomain).filter((d) => Array.isArray(QUESTION_BANK[d]));
  if (!quizState.domainOrder.length) {
    quizState.domainOrder = shuffle(domains);
  }
  for (const d of domains) {
    if (!quizState.deckByDomain[d] || !quizState.deckByDomain[d].length) {
      const cycle = quizState.cycleByDomain[d] || 0;
      quizState.deckByDomain[d] = makeDomainDeck(d, cycle);
      quizState.cycleByDomain[d] = cycle + 1;
    }
  }
}

function nextQuizQuestion() {
  ensureQuizDecks();
  const domains = quizState.domainOrder;
  if (!domains.length) return makeDomainDeck('Full Stack', 0)[0];
  for (let i = 0; i < domains.length; i += 1) {
    const domain = domains[quizState.domainPointer % domains.length];
    quizState.domainPointer = (quizState.domainPointer + 1) % domains.length;

    if (!quizState.deckByDomain[domain] || !quizState.deckByDomain[domain].length) {
      const cycle = quizState.cycleByDomain[domain] || 0;
      quizState.deckByDomain[domain] = makeDomainDeck(domain, cycle);
      quizState.cycleByDomain[domain] = cycle + 1;
    }

    if (quizState.deckByDomain[domain].length) {
      return quizState.deckByDomain[domain].pop();
    }
  }
  return makeDomainDeck('Full Stack', 0)[0];
}

function resetQuizState() {
  quizState.domainOrder = [];
  quizState.domainPointer = 0;
  quizState.deckByDomain = {};
  quizState.cycleByDomain = {};
  activeQuizQuestion = null;
}

function applyClanTheme() {
  if (!activeClan) return;
  // CPU is always your OWN clan's CPU, never another clan's.
  opponentClanKey = activeClanKey;
  opponentClan = activeClan;

  document.getElementById('pav-p').textContent = activeClan.badge;
  document.getElementById('pname-p').textContent = `YOU • ${activeClan.name}`;
  document.getElementById('card-p').style.borderColor = activeClan.color;
  document.getElementById('pav-c').textContent = opponentClan.badge;
  document.getElementById('pname-c').textContent = `CPU • ${opponentClan.name}`;
  document.getElementById('card-c').style.borderColor = opponentClan.color;
  document.getElementById('tname').style.color = activeClan.color;
  document.title = `8 Ball Pool — ${activeClan.name}`;
}

function showLogin(message = 'Select clan and enter password to start') {
  const ov = document.getElementById('loginov');
  const grid = document.getElementById('clan-grid');
  const status = document.getElementById('pw-status');
  const pw = document.getElementById('pw-in');
  grid.innerHTML = '';
  status.textContent = message;
  pw.value = '';

  Object.entries(CLANS).forEach(([key, clan]) => {
    const b = document.createElement('button');
    b.className = 'clan-btn' + (activeClanKey === key ? ' active' : '');
    b.innerHTML = `<img class="clan-logo" src="${clan.logo}" alt="${clan.name}" onerror="this.outerHTML='&lt;span class=&quot;clan-badge-fallback&quot;&gt;${clan.badge}&lt;/span&gt;'"><span>${clan.name}</span>`;
    b.style.borderColor = activeClanKey === key ? clan.color : '';
    b.onclick = () => {
      activeClanKey = key;
      activeClan = CLANS[key];
      showLogin('Enter clan password');
      setTimeout(() => document.getElementById('pw-in').focus(), 0);
    };
    grid.appendChild(b);
  });

  ov.classList.add('show');
}

function hideLogin() {
  document.getElementById('loginov').classList.remove('show');
}

function confirmClanLogin() {
  const status = document.getElementById('pw-status');
  const entered = document.getElementById('pw-in').value.trim();
  if (!activeClanKey) {
    status.textContent = 'Select a clan first.';
    return;
  }

  if (entered !== CLANS[activeClanKey].password) {
    status.textContent = 'Incorrect password.';
    return;
  }

  hideLogin();
  resetQuizState();
  resetMatchPooled();
  // CPU opponent is always this same clan's CPU.
  opponentClanKey = activeClanKey;
  opponentClan = activeClan;
  applyClanTheme();
  initGame();
  drawScene();

  loginPlayer(activeClanKey).catch((err) => {
    console.error('Failed to record player login in Firestore:', err);
  });
}

// ══════════════════════════════
//  STATE
// ══════════════════════════════
const canvas=document.getElementById('c');
const ctx=canvas.getContext('2d');

let balls=[],cue=null;
let animating=false,dragging=false,dragStart=null;
let shotOwner=null; // who fired the ball currently in motion — used so a mid-animation
                     // turn change (e.g. quiz resolving) can't misattribute the shot's outcome
let mouse={x:BASE_W/2,y:BASE_H/2};
let turn=0;
let assignment=[null,null];
let scores=[0,0];
let gameOver=false;
let pocketedThisTurn=[];
let cpuThinking=false;
let aimAngle=0,cpuPull=0;
let firstHitId=null;
let timerSec=TURN_SEC,timerIv=null;
let scale=1;
let skipTurn=[false,false];
let quizActive=false, quizSec=QUIZ_SEC, quizIv=null;
let turnToken=0;      // bumped on every turn transition; stale timeouts check this before acting
let inputLocked=false; // true during any turn-handoff window, blocks player input even if turn===0 briefly
// playerCanShoot is the ONLY thing that arms the cue stick for the human player.
// It is set true in exactly one place — right after a CORRECT quiz answer — and
// is force-cleared on every other transition (quiz start, wrong answer, foul,
// shot fired, CPU's turn, new game). This closes the timing-gap exploit where a
// shot fired during the brief handoff window could get misattributed to CPU.
let playerCanShoot=false;

let currentMode=window.innerWidth<=700?'mobile':'laptop';

// ══════════════════════════════
//  MODE SWITCH
// ══════════════════════════════
function applyMode(){
  const tog=document.getElementById('tog');
  const ll=document.getElementById('lbl-lap');
  const lm=document.getElementById('lbl-mob');
  if(currentMode==='mobile'){
    tog.className='mob'; ll.classList.remove('active'); lm.classList.add('active');
  } else {
    tog.className=''; ll.classList.add('active'); lm.classList.remove('active');
  }
  resize(); drawScene();
}
document.getElementById('tog').addEventListener('click',()=>{
  currentMode=currentMode==='laptop'?'mobile':'laptop'; applyMode();
});
document.getElementById('lbl-lap').addEventListener('click',()=>{if(currentMode!=='laptop'){currentMode='laptop';applyMode();}});
document.getElementById('lbl-mob').addEventListener('click',()=>{if(currentMode!=='mobile'){currentMode='mobile';applyMode();}});

// ══════════════════════════════
//  CANVAS SIZING
// ══════════════════════════════
function resize(){
  canvas.width=BASE_W; canvas.height=BASE_H;
  canvas.style.transform='none';
  canvas.style.margin='0';

  const modeH = document.getElementById('modebar').offsetHeight || 30;
  const hudH  = document.getElementById('hud').offsetHeight    || 50;
  const pwrH  = document.getElementById('phud').offsetHeight   || 34;
  const topUsed = modeH + hudH;

  const gwrap = document.getElementById('gwrap');
  gwrap.style.top    = topUsed + 'px';
  gwrap.style.bottom = pwrH + 'px';

  const avW = window.innerWidth;
  const avH = window.innerHeight - topUsed - pwrH;

  if(currentMode==='mobile'){
    const sx = avW / BASE_H;
    const sy = avH / BASE_W;
    scale = Math.min(sx, sy) * 0.93;
    const cw = Math.floor(BASE_W * scale);
    const ch = Math.floor(BASE_H * scale);
    canvas.style.width  = cw + 'px';
    canvas.style.height = ch + 'px';
    const shift = (cw - ch) / 2;
    canvas.style.transform  = 'rotate(90deg)';
    canvas.style.marginLeft = shift + 'px';
    canvas.style.marginTop  = (-shift) + 'px';
  } else {
    const sx = avW  / BASE_W;
    const sy = avH  / BASE_H;
    scale = Math.min(sx, sy) * 0.95;
    const cw = Math.floor(BASE_W * scale);
    const ch = Math.floor(BASE_H * scale);
    canvas.style.width  = cw + 'px';
    canvas.style.height = ch + 'px';
  }
}

// ══════════════════════════════
//  INIT
// ══════════════════════════════
function initGame(){
  balls=[];
  balls.push({id:0,x:PX+PW*0.25,y:BASE_H/2,vx:0,vy:0,pocketed:false});
  const rx=PX+PW*0.72,ry=BASE_H/2,gap=R*2+0.5;
  const ORDER=[1,9,2,3,8,10,4,14,11,6,13,7,15,12,5];
  let oi=0;
  for(let row=0;row<5;row++) for(let col=0;col<=row;col++){
    const id=ORDER[oi++];
    balls.push({id,pocketed:false,
      x:rx+row*gap*Math.cos(Math.PI/6),
      y:ry+(col-row/2)*gap,vx:0,vy:0});
  }
  cue=balls[0];
  gameOver=false;dragging=false;animating=false;cpuThinking=false;
  turn=0;assignment=[null,null];scores=[0,0];
  firstHitId=null;pocketedThisTurn=[];
  skipTurn=[false,false];
  turnToken++;inputLocked=false;
  playerCanShoot=false;
  resetMatchPooled();
  quizActive=false;
  document.getElementById('winov').classList.remove('show');
  if (!activeClan) {
    showLogin();
    showMsg('Select clan to start billiards.');
    updateHUD();
    drawScene();
    return;
  }
  applyClanTheme();
  updateHUD();
  renderAdminPortal();
  showMsg('Answer the quest to shoot!');
  // IMMEDIATELY show quiz for player 0
  inputLocked=true;
  setTimeout(()=>showQuiz(), 800);
}

// ══════════════════════════════
//  QUIZ SYSTEM
// ══════════════════════════════
function showQuiz(){
  if(quizActive||gameOver||turn!==0)return;
  if(animating){setTimeout(showQuiz,150);return;} // wait for the in-flight shot to fully settle
  inputLocked=false;
  playerCanShoot=false; // stick stays disarmed until this quiz is answered correctly
  quizActive=true;
  activeQuizQuestion = nextQuizQuestion();
  const q = activeQuizQuestion;
  document.getElementById('quizq').textContent=`[${q.domain}] ${q.q}`;
  const ansDiv=document.getElementById('quizans');
  ansDiv.innerHTML='';
  q.opts.forEach((opt,i)=>{
    const btn=document.createElement('button');
    btn.className='ans-btn';
    btn.textContent=opt;
    btn.onclick=()=>answerQuiz(i===q.correct,i);
    ansDiv.appendChild(btn);
  });
  document.getElementById('quizov').classList.add('show');
  // Timer
  quizSec=QUIZ_SEC;
  renderQuizTimer();
  clearInterval(quizIv);
  quizIv=setInterval(()=>{
    quizSec--;
    renderQuizTimer();
    if(quizSec<=0){
      clearInterval(quizIv);
      answerQuiz(false,-1);
    }
  },1000);
}

function renderQuizTimer(){
  document.getElementById('qtimer').textContent=quizSec+'s';
  document.getElementById('qbar').style.width=(quizSec/QUIZ_SEC*100)+'%';
}

function answerQuiz(correct,selectedIndex){
  if(!quizActive)return;
  clearInterval(quizIv);
  const btns=document.querySelectorAll('.ans-btn');
  btns.forEach(b=>b.disabled=true);

  btns.forEach((b,idx)=>{
    if(activeQuizQuestion&&idx===activeQuizQuestion.correct)b.classList.add('correct');
    if(selectedIndex===idx&&activeQuizQuestion&&idx!==activeQuizQuestion.correct)b.classList.add('wrong');
  });

  if(correct){
    showMsg('✓ Correct! Shoot now!');
    setTimeout(()=>{
      document.getElementById('quizov').classList.remove('show');
      quizActive=false;
      activeQuizQuestion=null;
      if(turn===0&&!gameOver) playerCanShoot=true; // ONLY place the stick gets armed
      startTimer(); // start game timer
    },1200);
  } else {
    // Wrong answer = lose this move only (no skip-turn penalty)
    playerCanShoot=false; // stick stays disarmed — this shot is forfeited, not handed to the player
    loseMove('quiz failure');
    setTimeout(()=>{
      document.getElementById('quizov').classList.remove('show');
      quizActive=false;
      activeQuizQuestion=null;
    },1400);
  }
}

// ══════════════════════════════
//  TIMER
// ══════════════════════════════
function startTimer(){
  clearInterval(timerIv); timerSec=TURN_SEC;
  timerIv=setInterval(()=>{
    if(animating||cpuThinking||gameOver){timerSec=TURN_SEC;renderTimer();return;}
    timerSec--; renderTimer();
    if(timerSec<=0){
      clearInterval(timerIv);
      if(turn===0){
        showMsg('⏱ Time up! Your turn skipped.',true);
        playerCanShoot=false;
        turn=1; updateHUD();
        safeHandoff(1000);
      }
    }
  },1000);
}
function renderTimer(){
  const pct=timerSec/TURN_SEC;
  const bar=document.getElementById('tbar');
  if(pct>0.5) bar.style.background=`linear-gradient(90deg,#22cc44,#88cc22)`;
  else if(pct>0.25) bar.style.background=`linear-gradient(90deg,#ffcc00,#ff8800)`;
  else bar.style.background=`linear-gradient(90deg,#ff4400,#ff0000)`;
  bar.style.width=(pct*100)+'%';
  document.getElementById('ttxt').textContent=timerSec;
}

// Runs `delay` ms after a turn flip. Locks input for that window so a
// player drag/click can't sneak a shot in while it's nominally CPU's turn,
// then checks the skip flag on whoever the turn now belongs to, and ALWAYS
// falls back to handoffTurnAction() if no skip applies — this fallback was
// missing on the timer-timeout path, which is what let control slip to the
// player and had shots recorded under the wrong side.
function safeHandoff(delay){
  inputLocked=true;
  turnToken++;
  const myToken=turnToken;
  setTimeout(()=>{
    if(myToken!==turnToken||gameOver)return; // a newer transition already superseded this one
    inputLocked=false;
    if(!handleSkipIfNeeded())handoffTurnAction();
  },delay);
}

function handleSkipIfNeeded(){
  if(gameOver)return false;
  if(skipTurn[turn]){
    skipTurn[turn]=false;
    const who=turn===0?'Your':'CPU';
    showMsg(`⏭ ${who} turn skipped (foul penalty)!`,turn===0);
    updateHUD();
    inputLocked=true;
    turnToken++;
    const myToken=turnToken;
    setTimeout(()=>{
      if(myToken!==turnToken||gameOver)return;
      turn=1-turn;updateHUD();
      inputLocked=false;
      handoffTurnAction();
    },1500);
    return true;
  }
  return false;
}

function handoffTurnAction(){
  // Only the human player gets quizzes. CPU turns go directly to AI shot logic.
  if(turn===0) showQuiz();
  else setTimeout(cpuShoot,900);
}

// ══════════════════════════════
//  HUD
// ══════════════════════════════
const GLABELS={solids:'● SOLIDS',stripes:'◎ STRIPES'};
const SOLID_IDS=[1,2,3,4,5,6,7],STRIPE_IDS=[9,10,11,12,13,14,15];
function ballsLeft(g){const ids=g==='solids'?SOLID_IDS:STRIPE_IDS;return ids.filter(id=>!balls.find(b=>b.id===id&&b.pocketed));}

function updateHUD(){
  document.getElementById('tname').textContent=gameOver?'🏆':(turn===0?'YOU':'CPU');
  document.getElementById('card-p').className='pcard'+(turn===0?' active':'')+(skipTurn[0]?' foul-turn':'');
  document.getElementById('card-c').className='pcard'+(turn===1?' active':'')+(skipTurn[1]?' foul-turn':'');
  const a0=assignment[0],a1=assignment[1];
  document.getElementById('grp-p').textContent=a0?GLABELS[a0]:'—';
  document.getElementById('grp-c').textContent=a1?GLABELS[a1]:'—';
  document.getElementById('skip-p').textContent=skipTurn[0]?'⚠ TURN SKIPPED':'';
  document.getElementById('skip-c').textContent=skipTurn[1]?'⚠ TURN SKIPPED':'';
  function dots(elId,grp){
    const el=document.getElementById(elId);el.innerHTML='';
    if(!grp)return;
    const all=grp==='solids'?SOLID_IDS:STRIPE_IDS;
    const rem=ballsLeft(grp);
    all.forEach(id=>{
      const d=document.createElement('div');d.className='bdot';
      const gone=!rem.includes(id);
      if(grp==='stripes'&&!gone){d.style.background='#f4f4f4';d.style.border='2px solid '+BCOLORS[id];}
      else{d.style.background=gone?'#1a1a1a':BCOLORS[id];}
      if(gone)d.style.opacity='0.2';
      el.appendChild(d);
    });
  }
  dots('br-p',a0);dots('br-c',a1);
  document.getElementById('pbar').style.width='0%';
  document.getElementById('ppct').textContent='0%';
}

function showMsg(t,isFoul=false){
  const el=document.getElementById('msgbar');
  el.textContent=t;
  el.className=isFoul?'foul':'';
}

// ══════════════════════════════
//  DRAW TABLE (same as before)
// ══════════════════════════════
function lighten(h,a){let r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);return`rgb(${Math.min(255,r+Math.round(255*a))},${Math.min(255,g+Math.round(255*a))},${Math.min(255,b+Math.round(255*a))}`+')';}
function darken(h,a){let r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);return`rgb(${Math.max(0,r-Math.round(255*a))},${Math.max(0,g-Math.round(255*a))},${Math.max(0,b-Math.round(255*a))}`+')';}

function drawTable(){
  const W=BASE_W,H=BASE_H;
  const wg=ctx.createLinearGradient(0,0,W,H);
  wg.addColorStop(0,'#5c3210');wg.addColorStop(.25,'#7a4a18');
  wg.addColorStop(.5,'#8a5420');wg.addColorStop(.75,'#7a4a18');wg.addColorStop(1,'#4a2808');
  ctx.fillStyle=wg;ctx.beginPath();ctx.roundRect(0,0,W,H,14);ctx.fill();
  ctx.save();ctx.beginPath();ctx.roundRect(0,0,W,H,14);ctx.clip();
  ctx.strokeStyle='rgba(0,0,0,.07)';ctx.lineWidth=1;
  for(let i=-H;i<W+H;i+=13){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i+H,H);ctx.stroke();}
  ctx.restore();
  ctx.save();ctx.beginPath();ctx.roundRect(0,0,W,H,14);ctx.clip();
  ctx.fillStyle='rgba(0,0,0,.38)';ctx.fillRect(RAIL-5,RAIL-5,PW+10,5);ctx.fillRect(RAIL-5,RAIL-5,5,PH+10);
  ctx.fillStyle='rgba(255,255,255,.06)';ctx.fillRect(RAIL,RAIL+PH,PW,5);ctx.fillRect(RAIL+PW,RAIL,5,PH);
  ctx.restore();
  ctx.strokeStyle='rgba(60,20,0,.6)';ctx.lineWidth=1.5;ctx.strokeRect(RAIL-1,RAIL-1,PW+2,PH+2);
  [{x:RAIL+PW*.25,y:RAIL*.5},{x:RAIL+PW*.5,y:RAIL*.5},{x:RAIL+PW*.75,y:RAIL*.5},
   {x:RAIL+PW*.25,y:H-RAIL*.5},{x:RAIL+PW*.5,y:H-RAIL*.5},{x:RAIL+PW*.75,y:H-RAIL*.5},
   {x:RAIL*.5,y:RAIL+PH*.33},{x:RAIL*.5,y:RAIL+PH*.67},
   {x:W-RAIL*.5,y:RAIL+PH*.33},{x:W-RAIL*.5,y:RAIL+PH*.67}]
  .forEach(d=>{ctx.save();ctx.translate(d.x,d.y);ctx.rotate(Math.PI/4);
    ctx.fillStyle='#c9a84c';ctx.fillRect(-3.5,-3.5,7,7);
    ctx.fillStyle='rgba(255,255,255,.22)';ctx.fillRect(-3.5,-3.5,3.5,3.5);ctx.restore();});
  POCKETS.forEach(p=>{
    const pg=ctx.createRadialGradient(p.x,p.y,PR*.3,p.x,p.y,PR+10);
    pg.addColorStop(0,'rgba(0,0,0,.9)');pg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.beginPath();ctx.arc(p.x,p.y,PR+10,0,Math.PI*2);ctx.fillStyle=pg;ctx.fill();
    ctx.beginPath();ctx.arc(p.x,p.y,PR,0,Math.PI*2);ctx.fillStyle='#030201';ctx.fill();
    ctx.beginPath();ctx.arc(p.x,p.y,PR+3,0,Math.PI*2);ctx.strokeStyle='#7a4f18';ctx.lineWidth=3;ctx.stroke();
    ctx.beginPath();ctx.arc(p.x-PR*.3,p.y-PR*.3,PR*.22,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,.07)';ctx.fill();
  });
  ctx.fillStyle='#1a7a45';ctx.fillRect(RAIL,RAIL,PW,PH);
  ctx.fillStyle='rgba(0,0,0,.03)';
  for(let fy=RAIL;fy<RAIL+PH;fy+=4)for(let fx=RAIL+(fy%8?2:0);fx<RAIL+PW;fx+=4)ctx.fillRect(fx,fy,1,1);
  ctx.strokeStyle='rgba(255,255,255,.055)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(W/2,RAIL);ctx.lineTo(W/2,RAIL+PH);ctx.stroke();
  ctx.beginPath();ctx.moveTo(RAIL+PW*.25,RAIL);ctx.lineTo(RAIL+PW*.25,RAIL+PH);ctx.stroke();
  ctx.beginPath();ctx.arc(RAIL+PW*.25,H/2,PH*.2,Math.PI*1.5,Math.PI*.5,true);ctx.stroke();
  [[W/2,H/2],[RAIL+PW*.72,H/2]].forEach(([sx,sy])=>{
    ctx.beginPath();ctx.arc(sx,sy,2.5,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,.12)';ctx.fill();});
  ctx.strokeStyle='rgba(255,210,80,.08)';ctx.lineWidth=1.5;ctx.strokeRect(RAIL,RAIL,PW,PH);
}

function drawBall(b){
  if(b.pocketed)return;
  const st=b.id>=9&&b.id<=15;
  ctx.save();
  ctx.beginPath();ctx.arc(b.x+2,b.y+3,R,0,Math.PI*2);
  const sg=ctx.createRadialGradient(b.x+2,b.y+3,0,b.x+2,b.y+3,R);
  sg.addColorStop(0,'rgba(0,0,0,.3)');sg.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=sg;ctx.fill();
  ctx.beginPath();ctx.arc(b.x,b.y,R,0,Math.PI*2);
  if(st){
    ctx.fillStyle='#f5f5f5';ctx.fill();ctx.save();ctx.clip();
    ctx.fillStyle=BCOLORS[b.id];ctx.fillRect(b.x-R,b.y-R*.46,R*2,R*.92);ctx.restore();
  } else {
    const bg=ctx.createRadialGradient(b.x-R*.3,b.y-R*.35,R*.05,b.x,b.y,R);
    bg.addColorStop(0,lighten(BCOLORS[b.id],.38));bg.addColorStop(.55,BCOLORS[b.id]);bg.addColorStop(1,darken(BCOLORS[b.id],.35));
    ctx.fillStyle=bg;ctx.fill();
  }
  if(b.id>0){
    ctx.beginPath();ctx.arc(b.x,b.y,R*.45,0,Math.PI*2);
    ctx.fillStyle=st?'#f5f5f5':'rgba(255,255,255,.16)';ctx.fill();
    ctx.fillStyle=b.id===8?'#eee':(st?'#222':'rgba(0,0,0,.72)');
    ctx.font=`bold ${b.id>=10?6:7}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(b.id,b.x,b.y+.5);
  }
  ctx.beginPath();ctx.arc(b.x-R*.3,b.y-R*.34,R*.24,0,Math.PI*2);
  ctx.fillStyle='rgba(255,255,255,.52)';ctx.fill();
  ctx.beginPath();ctx.arc(b.x,b.y,R,0,Math.PI*2);
  ctx.strokeStyle='rgba(0,0,0,.28)';ctx.lineWidth=.8;ctx.stroke();
  ctx.restore();
}

function drawCueStick(bx,by,angle,pull,alpha=1){
  if(quizActive)return; // hide stick while quiz is open
  ctx.save();ctx.globalAlpha=alpha;
  const nx=Math.cos(angle),ny=Math.sin(angle);
  const off=R+6+pull,len=195;
  const tx=bx-nx*off,ty=by-ny*off,ex=bx-nx*(off+len),ey=by-ny*(off+len);
  const g=ctx.createLinearGradient(tx,ty,ex,ey);
  g.addColorStop(0,'#e8d090');g.addColorStop(.05,'#c8a838');g.addColorStop(.18,'#b89028');
  g.addColorStop(.5,'#9a7020');g.addColorStop(.85,'#5a3a10');g.addColorStop(1,'#1e0c04');
  ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(ex,ey);
  ctx.strokeStyle=g;ctx.lineWidth=7;ctx.lineCap='round';ctx.stroke();
  ctx.beginPath();ctx.moveTo(bx-nx*(off-2),by-ny*(off-2));ctx.lineTo(bx-nx*(off+9),by-ny*(off+9));
  ctx.strokeStyle='#eeeeee';ctx.lineWidth=4.5;ctx.stroke();
  ctx.beginPath();ctx.arc(tx,ty,3,0,Math.PI*2);ctx.fillStyle='#5588cc';ctx.fill();
  [.62,.70,.78].forEach(t=>{
    const wx=tx+(ex-tx)*t,wy=ty+(ey-ty)*t;
    ctx.beginPath();ctx.arc(wx,wy,3.5,0,Math.PI*2);
    ctx.strokeStyle='rgba(255,255,255,.18)';ctx.lineWidth=1;ctx.stroke();
  });
  ctx.restore();
}

function drawAimLine(bx,by,angle,alpha=1){
  if(quizActive)return; // hide aim line while quiz is open
  ctx.save();ctx.globalAlpha=alpha;
  let x=bx,y=by,dx=Math.cos(angle),dy=Math.sin(angle);
  const segs=[];let hitBall=null;
  const STEP=2,MAXD=2200;let dist=0,sx=x,sy=y;
  while(dist<MAXD){
    x+=dx*STEP;y+=dy*STEP;dist+=STEP;
    for(const b of balls){if(b.pocketed||b.id===0)continue;if(Math.hypot(x-b.x,y-b.y)<R*2){hitBall=b;break;}}
    if(hitBall)break;
    let bounced=false;
    if(x-R<RAIL){x=RAIL+R;dx=-dx;bounced=true;}
    if(x+R>BASE_W-RAIL){x=BASE_W-RAIL-R;dx=-dx;bounced=true;}
    if(y-R<RAIL){y=RAIL+R;dy=-dy;bounced=true;}
    if(y+R>BASE_H-RAIL){y=BASE_H-RAIL-R;dy=-dy;bounced=true;}
    if(bounced){segs.push({x1:sx,y1:sy,x2:x,y2:y});sx=x;sy=y;if(segs.length>=2)break;}
  }
  segs.push({x1:sx,y1:sy,x2:x,y2:y});
  segs.forEach((s,i)=>{
    ctx.setLineDash([4,7]);
    ctx.strokeStyle=i===0?'rgba(255,255,255,.6)':'rgba(255,255,255,.28)';
    ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(s.x1,s.y1);ctx.lineTo(s.x2,s.y2);ctx.stroke();
  });
  ctx.setLineDash([]);
  if(hitBall){
    ctx.beginPath();ctx.arc(x,y,R,0,Math.PI*2);
    ctx.strokeStyle='rgba(255,255,255,.72)';ctx.lineWidth=1.6;ctx.setLineDash([2,3]);ctx.stroke();ctx.setLineDash([]);
    const cd=Math.max(.001,Math.hypot(hitBall.x-x,hitBall.y-y));
    const tnx=(hitBall.x-x)/cd,tny=(hitBall.y-y)/cd;
    ctx.beginPath();ctx.setLineDash([3,5]);ctx.strokeStyle='rgba(255,220,60,.65)';ctx.lineWidth=1.4;
    ctx.moveTo(hitBall.x,hitBall.y);ctx.lineTo(hitBall.x+tnx*65,hitBall.y+tny*65);ctx.stroke();ctx.setLineDash([]);
  } else {
    ctx.beginPath();ctx.arc(x,y,3.5,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,.4)';ctx.fill();
  }
  ctx.restore();
}

function drawPowerArc(power){
  if(quizActive)return;
  const sa=-Math.PI*1.1,ea=Math.PI*.1,arcR=R+18;
  ctx.save();
  ctx.beginPath();ctx.arc(cue.x,cue.y,arcR,sa,ea);ctx.strokeStyle='rgba(0,0,0,.4)';ctx.lineWidth=5;ctx.stroke();
  if(power>.02){
    const gd=ctx.createLinearGradient(cue.x-arcR,cue.y,cue.x+arcR,cue.y);
    gd.addColorStop(0,'#22cc44');gd.addColorStop(.5,'#ffcc00');gd.addColorStop(1,'#ff2200');
    ctx.beginPath();ctx.arc(cue.x,cue.y,arcR,sa,sa+(ea-sa)*power);
    ctx.strokeStyle=gd;ctx.lineWidth=5;ctx.lineCap='round';ctx.stroke();
  }
  ctx.restore();
}

function drawScene(){
  ctx.clearRect(0,0,BASE_W,BASE_H);
  drawTable();balls.forEach(drawBall);
  if(!animating&&!gameOver){
    if(turn===0&&cue&&!cue.pocketed){
      let angle,pull=0;
      if(dragging){
        const dx=mouse.x-dragStart.x,dy=mouse.y-dragStart.y;
        const d=Math.hypot(dx,dy);pull=Math.min(d,120);
        angle=d>.5?Math.atan2(-dy,-dx):0;
      } else {
        const dx=mouse.x-cue.x,dy=mouse.y-cue.y;angle=Math.atan2(dy,dx);
      }
      drawCueStick(cue.x,cue.y,angle,pull);
      drawAimLine(cue.x,cue.y,angle);
      if(dragging)drawPowerArc(getPower());
    }
    if(turn===1&&cpuThinking&&cue&&!cue.pocketed){
      drawCueStick(cue.x,cue.y,aimAngle,cpuPull,.72);
      drawAimLine(cue.x,cue.y,aimAngle,.5);
    }
  }
}

// ══════════════════════════════
//  PHYSICS (same as before)
// ══════════════════════════════
function physicsStep(){
  balls.forEach(b=>{
    if(b.pocketed)return;
    if(b.id!==0&&firstHitId===null&&Math.hypot(b.x-cue.x,b.y-cue.y)<R*2+1)firstHitId=b.id;
    b.x+=b.vx;b.y+=b.vy;b.vx*=FRICTION;b.vy*=FRICTION;
    if(Math.abs(b.vx)<MIN_VEL)b.vx=0;if(Math.abs(b.vy)<MIN_VEL)b.vy=0;
    if(b.x-R<RAIL){b.x=RAIL+R;b.vx=Math.abs(b.vx)*.76;}
    if(b.x+R>BASE_W-RAIL){b.x=BASE_W-RAIL-R;b.vx=-Math.abs(b.vx)*.76;}
    if(b.y-R<RAIL){b.y=RAIL+R;b.vy=Math.abs(b.vy)*.76;}
    if(b.y+R>BASE_H-RAIL){b.y=BASE_H-RAIL-R;b.vy=-Math.abs(b.vy)*.76;}
  });
  for(let i=0;i<balls.length;i++)for(let j=i+1;j<balls.length;j++){
    const a=balls[i],b=balls[j];
    if(a.pocketed||b.pocketed)continue;
    const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);
    if(d<R*2&&d>.01){
      const nx=dx/d,ny=dy/d,ov=R*2-d;
      a.x-=nx*ov/2;a.y-=ny*ov/2;b.x+=nx*ov/2;b.y+=ny*ov/2;
      const dv=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;
      if(dv>0){a.vx-=dv*nx;a.vy-=dv*ny;b.vx+=dv*nx;b.vy+=dv*ny;}
      if((a.id===0||b.id===0)&&firstHitId===null)firstHitId=a.id===0?b.id:a.id;
    }
  }
  const newly=[];
  balls.forEach(b=>{
    if(b.pocketed)return;
    POCKETS.forEach(p=>{if(Math.hypot(b.x-p.x,b.y-p.y)<PR+2){b.pocketed=true;b.vx=0;b.vy=0;newly.push(b);}});
  });
  return newly;
}
function allStopped(){return balls.every(b=>b.pocketed||(Math.abs(b.vx)<MIN_VEL&&Math.abs(b.vy)<MIN_VEL));}
function runAnim(){
  if(!animating)return;
  pocketedThisTurn.push(...physicsStep());
  drawScene();
  if(allStopped()){animating=false;endTurn([...pocketedThisTurn]);pocketedThisTurn=[];firstHitId=null;}
  else requestAnimationFrame(runAnim);
}

// ══════════════════════════════
//  GAME LOGIC
// ══════════════════════════════
function replaceCueBall(){
  cue.pocketed=false;cue.x=RAIL+PW*.22;cue.y=BASE_H/2;cue.vx=0;cue.vy=0;
}
function isSolid(id){return id>=1&&id<=7;}
function isStripe(id){return id>=9&&id<=15;}

function applyFoul(reason){
  playerCanShoot=false;
  replaceCueBall();
  skipTurn[turn]=true;
  const foulerName=turn===0?'You':'CPU';
  const oppName=turn===0?'CPU\'s':'Your';
  showMsg(`⚠ ${foulerName} fouled (${reason})! ${oppName} turn + skip penalty!`,true);
  turn=1-turn;updateHUD();startTimer();
  safeHandoff(1400);
}

// Losing the current move (e.g. wrong quiz answer) is NOT a foul: it just
// passes the turn to the opponent once, with no extra skip-turn penalty.
function loseMove(reason){
  playerCanShoot=false;
  const loserName=turn===0?'You':'CPU';
  const oppName=turn===0?'CPU\'s':'Your';
  showMsg(`✗ ${loserName} lost the move (${reason})! ${oppName} turn.`);
  turn=1-turn;updateHUD();startTimer();
  safeHandoff(1400);
}

function endTurn(pocketed){
  if(gameOver)return;
  clearInterval(timerIv);
  const actor = (shotOwner!==null)?shotOwner:turn;
  shotOwner=null;
  turn=actor; // resolve this shot's outcome against whoever actually took it
  const pooledNow = pocketed.filter(b=>b.id!==0).map(b=>b.id);
  if (pooledNow.length) {
    recordPooledBalls(actor, pooledNow);
    renderAdminPortal();
  }
  const cpkt=pocketed.find(b=>b.id===0);
  const epkt=pocketed.find(b=>b.id===8);
  const others=pocketed.filter(b=>b.id!==0&&b.id!==8);
  const solids=others.filter(b=>isSolid(b.id));
  const stripes=others.filter(b=>isStripe(b.id));

  let foulReason=null;
  if(firstHitId!==null&&assignment[turn]!==null){
    const g=assignment[turn];
    if(g==='solids'&&!isSolid(firstHitId)&&firstHitId!==8)foulReason='hit wrong ball first';
    if(g==='stripes'&&!isStripe(firstHitId)&&firstHitId!==8)foulReason='hit wrong ball first';
    if(g==='solids'&&firstHitId===8&&ballsLeft('solids').length>0)foulReason='hit 8-ball too early';
    if(g==='stripes'&&firstHitId===8&&ballsLeft('stripes').length>0)foulReason='hit 8-ball too early';
  }

  if(epkt){
    const g=assignment[turn];
    const left=g?ballsLeft(g):['x'];
    const legal=!cpkt&&left.length===0&&g!==null&&!foulReason;
    if(legal){
      endGame(turn===0,'You potted 8 legally! 🎱','CPU potted 8 legally!');
    } else {
      endGame(turn!==0,
        turn===0?'You potted 8 illegally — CPU wins!':'CPU potted 8 illegally — you win! 🎱');
    }
    return;
  }

  if(cpkt){applyFoul('cue ball potted');return;}
  if(foulReason){applyFoul(foulReason);return;}

  if(others.length>0&&assignment[turn]===null){
    if(solids.length>0&&stripes.length===0){assignment[turn]='solids';assignment[1-turn]='stripes';}
    else if(stripes.length>0&&solids.length===0){assignment[turn]='stripes';assignment[1-turn]='solids';}
    else if(solids.length>=stripes.length){assignment[turn]='solids';assignment[1-turn]='stripes';}
    else{assignment[turn]='stripes';assignment[1-turn]='solids';}
  }

  const g=assignment[turn];
  let valid=0;
  if(g==='solids')valid=solids.length;
  else if(g==='stripes')valid=stripes.length;
  else valid=others.length;
  const wrongPot=others.length-valid;
  const keep=valid>0&&wrongPot===0;
  if(valid>0)scores[turn]+=valid;

  if(wrongPot>0){applyFoul('potted opponent\'s balls');return;}

  if(keep){
    showMsg(turn===0?`Nice! ${valid} potted — shoot again! 🎯`:`CPU potted ${valid} — shooting again…`);
    updateHUD();
    if(turn===1)setTimeout(cpuShoot,900);
    else{inputLocked=true;setTimeout(()=>showQuiz(),800);}
  } else {
    const w=turn===0?'CPU\'s':'Your';
    showMsg(`No pot — ${w} turn.`);
    turn=1-turn;updateHUD();
    inputLocked=true;
    setTimeout(()=>{
      inputLocked=false;
      if(!handleSkipIfNeeded())handoffTurnAction();
    },1100);
  }
  drawScene();
}

function endGame(pWins,msg){
  gameOver=true;clearInterval(timerIv);clearInterval(quizIv);
  recordMatchResult(pWins);
  renderAdminPortal();
  document.getElementById('winemoji').textContent=pWins?'🏆':'😞';
  document.getElementById('wintxt').textContent=pWins?'YOU WIN!':'CPU WINS';
  document.getElementById('winsub').textContent=msg;
  document.getElementById('winov').classList.add('show');
  updateHUD();
}

// ══════════════════════════════
//  CPU AI
// ══════════════════════════════
function cpuShoot(){
  if(gameOver||turn!==1||animating||quizActive)return;
  cpuThinking=true;
  const g=assignment[1];
  let tgts=[];
  if(g==='solids')tgts=balls.filter(b=>!b.pocketed&&isSolid(b.id));
  else if(g==='stripes')tgts=balls.filter(b=>!b.pocketed&&isStripe(b.id));
  else tgts=balls.filter(b=>!b.pocketed&&b.id!==0&&b.id!==8);
  const eight=balls.find(b=>b.id===8&&!b.pocketed);
  if(tgts.length===0&&eight)tgts=[eight];
  if(!tgts.length){cpuThinking=false;return;}

  let best=null,bestS=-Infinity;
  tgts.forEach(tgt=>{
    POCKETS.forEach(pkt=>{
      const tx=pkt.x-tgt.x,ty=pkt.y-tgt.y,td=Math.hypot(tx,ty);
      const nx=tx/td,ny=ty/td;
      const gx=tgt.x-nx*R*2,gy=tgt.y-ny*R*2;
      const dx=gx-cue.x,dy=gy-cue.y,dist=Math.hypot(dx,dy);
      if(dist<1)return;
      let blocked=false;
      balls.forEach(b=>{
        if(b.pocketed||b.id===0||b.id===tgt.id)return;
        const cx=b.x-cue.x,cy=b.y-cue.y;
        const proj=(cx*dx+cy*dy)/(dist*dist);
        if(proj<.05||proj>.98)return;
        if(Math.hypot(cx-proj*dx,cy-proj*dy)<R*2.2)blocked=true;
      });
      if(blocked)return;
      const sc=200/dist+(pkt===POCKETS[1]||pkt===POCKETS[4]?7:0)+Math.random()*12;
      if(sc>bestS){bestS=sc;best={angle:Math.atan2(dy,dx)};}
    });
  });
  if(!best){
    const n=tgts.reduce((a,b)=>Math.hypot(b.x-cue.x,b.y-cue.y)<Math.hypot(a.x-cue.x,a.y-cue.y)?b:a);
    best={angle:Math.atan2(n.y-cue.y,n.x-cue.x)};
  }
  aimAngle=best.angle;cpuPull=0;
  const power=Math.min(.42+Math.random()*.44,.94);
  let t=0;
  const iv=setInterval(()=>{
    t+=.07;cpuPull=Math.sin(t)*power*110;drawScene();
    if(t>Math.PI){clearInterval(iv);cpuThinking=false;fireCue(aimAngle,power);}
  },32);
}
function fireCue(angle,power){
  if(!cue||cue.pocketed)return;
  cue.vx=Math.cos(angle)*power*MAX_SHOT;cue.vy=Math.sin(angle)*power*MAX_SHOT;
  shotOwner=1;
  animating=true;pocketedThisTurn=[];firstHitId=null;runAnim();startTimer();
}

// ══════════════════════════════
//  INPUT
// ══════════════════════════════
function evXY(e){
  const rect=canvas.getBoundingClientRect();
  let cx,cy;
  if(e.touches&&e.touches.length){cx=e.touches[0].clientX;cy=e.touches[0].clientY;}
  else if(e.changedTouches&&e.changedTouches.length){cx=e.changedTouches[0].clientX;cy=e.changedTouches[0].clientY;}
  else{cx=e.clientX;cy=e.clientY;}

  if(currentMode==='mobile'){
    const cxC=rect.left+rect.width/2,cyC=rect.top+rect.height/2;
    const lx=cx-cxC,ly=cy-cyC;
    const canX=BASE_W/2-ly/scale;
    const canY=BASE_H/2+lx/scale;
    return{x:Math.max(-200,Math.min(BASE_W+200,canX)),y:Math.max(-200,Math.min(BASE_H+200,canY))};
  }
  return{x:Math.max(-200,Math.min(BASE_W+200,(cx-rect.left)/scale)),y:Math.max(-200,Math.min(BASE_H+200,(cy-rect.top)/scale))};
}

function getPower(){
  if(!dragging||!dragStart)return 0;
  return Math.min(Math.hypot(mouse.x-dragStart.x,mouse.y-dragStart.y),120)/120;
}
function setPowerUI(p){
  document.getElementById('pbar').style.width=(p*100)+'%';
  document.getElementById('ppct').textContent=Math.round(p*100)+'%';
}

canvas.addEventListener('mousedown',e=>{
  if(animating||gameOver||turn!==0||!cue||cue.pocketed||quizActive||inputLocked||!playerCanShoot)return;
  const {x,y}=evXY(e);
  if(x>=RAIL&&x<=BASE_W-RAIL&&y>=RAIL&&y<=BASE_H-RAIL){
    dragging=true;dragStart={x,y};mouse={x,y};e.preventDefault();
  }
});
canvas.addEventListener('touchstart',e=>{
  if(animating||gameOver||turn!==0||!cue||cue.pocketed||quizActive||inputLocked||!playerCanShoot)return;
  const {x,y}=evXY(e);
  if(x>=RAIL&&x<=BASE_W-RAIL&&y>=RAIL&&y<=BASE_H-RAIL){
    dragging=true;dragStart={x,y};mouse={x,y};
  }
},{passive:true});

window.addEventListener('mousemove',e=>{
  if(!dragging)return;
  const {x,y}=evXY(e);mouse={x,y};
  setPowerUI(getPower());if(!animating)drawScene();
});
window.addEventListener('touchmove',e=>{
  if(!dragging)return;
  const {x,y}=evXY(e);mouse={x,y};
  setPowerUI(getPower());if(!animating)drawScene();
  if(e.cancelable)e.preventDefault();
},{passive:false});

canvas.addEventListener('mousemove',e=>{
  if(dragging||animating||quizActive||turn!==0||!playerCanShoot)return;
  const {x,y}=evXY(e);mouse={x,y};drawScene();
});

window.addEventListener('mouseup',e=>{
  if(!dragging||turn!==0||!playerCanShoot)return;
  const {x,y}=evXY(e);mouse={x,y};shoot();
});
window.addEventListener('touchend',e=>{
  if(!dragging||turn!==0||!playerCanShoot)return;
  const {x,y}=evXY(e);mouse={x,y};shoot();
},{passive:true});
window.addEventListener('touchcancel',()=>{if(dragging&&turn===0&&playerCanShoot)shoot();},{passive:true});

function shoot(){
  const dx=mouse.x-dragStart.x,dy=mouse.y-dragStart.y;
  const pull=Math.min(Math.hypot(dx,dy),120);
  if(pull>5&&cue&&!cue.pocketed){
    const d=Math.hypot(dx,dy),power=pull/120;
    cue.vx=(-dx/d)*power*MAX_SHOT;cue.vy=(-dy/d)*power*MAX_SHOT;
    shotOwner=0;
    playerCanShoot=false; // spent — next shot requires a fresh correct answer
    animating=true;pocketedThisTurn=[];firstHitId=null;runAnim();startTimer();
  }
  dragging=false;dragStart=null;setPowerUI(0);
}

document.getElementById('ngbtn').addEventListener('click',()=>{initGame();resize();drawScene();});
document.getElementById('winbtn').addEventListener('click',()=>{initGame();resize();drawScene();});
document.getElementById('admin-btn').addEventListener('click',openAdminPortal);
document.getElementById('admin-close').addEventListener('click',closeAdminPortal);
document.getElementById('adminov').addEventListener('click',(e)=>{if(e.target.id==='adminov')closeAdminPortal();});
document.getElementById('pw-ok').addEventListener('click',confirmClanLogin);
document.getElementById('pw-cancel').addEventListener('click',()=>{
  document.getElementById('pw-status').textContent='Select clan and enter password to start';
  document.getElementById('pw-in').value='';
});
document.getElementById('pw-in').addEventListener('keydown',(e)=>{
  if(e.key==='Enter')confirmClanLogin();
});

let rsT;
window.addEventListener('resize',()=>{clearTimeout(rsT);rsT=setTimeout(()=>{resize();drawScene();},200);});

applyMode();
initGame();
drawScene();
