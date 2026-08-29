# FaithBid canonical marketplace metrics

These labels describe different database entities and must not be presented as interchangeable totals.

| Product label | Canonical definition | Current Oak Ridge account check |
| --- | --- | ---: |
| Projects posted | Count of `projects` rows owned by the church (`projects.church_id`) | 15 |
| Projects with vendor hired | Count of those project rows whose `hired_vendor_id` is non-null | 5 |
| Hired proposal records | Count of `bids` rows for the church whose normalized status is `hired`; this is an audit/history count, not a unique-project KPI | 9 |
| Deal Rooms | Count of `conversations` rows owned by the church | 13 |
| Projects represented in Deal Rooms | Count of distinct non-null `conversations.project_id` values for the church | 11 |

Product surfaces should use **Projects with vendor hired** for the church hiring KPI and **Deal Rooms** for thread count. The hired-proposal and distinct-conversation-project counts are diagnostic metrics and should be labeled explicitly wherever they are exposed.
