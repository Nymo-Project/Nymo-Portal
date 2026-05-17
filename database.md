## Table `calls`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `status` | `varchar` |  |
| `started_at` | `timestamp` |  Nullable |
| `ended_at` | `timestamp` |  Nullable |
| `chat_id` | `uuid` |  Nullable |
| `initiator_id` | `uuid` |  Nullable |
| `created_at` | `timestamp` |  |

## Table `chat_members`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `chat_id` | `uuid` |  Nullable |
| `user_id` | `uuid` |  Nullable |
| `joined_at` | `timestamp` |  |

## Table `chats`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `name` | `varchar` |  |
| `is_private` | `bool` |  |
| `is_group` | `bool` |  |
| `owner_id` | `uuid` |  Nullable |
| `created_at` | `timestamp` |  |
| `image_url` | `text` |  Nullable |

## Table `folder_chats`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `folder_id` | `uuid` |  Nullable |
| `chat_id` | `uuid` |  Nullable |
| `created_at` | `timestamp` |  |

## Table `folders`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `name` | `varchar` |  |
| `order` | `int4` |  |
| `user_id` | `uuid` |  Nullable |
| `created_at` | `timestamp` |  |

## Table `location_points`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `lat` | `numeric` |  |
| `lng` | `numeric` |  |
| `shared_at` | `timestamp` |  |
| `user_id` | `uuid` |  Nullable |
| `created_at` | `timestamp` |  |

## Table `marketplace_offers`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `listing_id` | `uuid` |  |
| `buyer_id` | `uuid` |  |
| `seller_id` | `uuid` |  |
| `product_id` | `uuid` |  |
| `quantity` | `int4` |  |
| `unit_price` | `int8` |  |
| `currency` | `varchar` |  |
| `status` | `varchar` |  |
| `created_at` | `timestamp` |  |

## Table `message_reads`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `message_id` | `uuid` |  Nullable |
| `user_id` | `uuid` |  Nullable |
| `read_at` | `timestamp` |  |

## Table `messages`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `content` | `text` |  |
| `attachment_url` | `text` |  Nullable |
| `attachment_mime_type` | `varchar` |  Nullable |
| `original_filename` | `varchar` |  Nullable |
| `reply_to_id` | `varchar` |  Nullable |
| `chat_id` | `uuid` |  Nullable |
| `user_id` | `uuid` |  Nullable |
| `created_at` | `timestamp` |  |

## Table `migrations`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int4` | Primary |
| `timestamp` | `int8` |  |
| `name` | `varchar` |  |

## Table `product_listings`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `seller_id` | `uuid` |  |
| `product_id` | `uuid` |  |
| `unit_price` | `int8` |  |
| `currency` | `varchar` |  |
| `quantity_available` | `int4` |  |
| `active` | `bool` |  |
| `created_at` | `timestamp` |  |
| `updated_at` | `timestamp` |  |

## Table `products`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `name` | `varchar` |  |
| `price_amount` | `int8` |  |
| `currency` | `varchar` |  |
| `active` | `bool` |  |
| `created_at` | `timestamp` |  |
| `updated_at` | `timestamp` |  |
| `image_url` | `text` |  Nullable |

## Table `stories`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `media_url` | `varchar` |  |
| `caption` | `text` |  Nullable |
| `expires_at` | `timestamp` |  |
| `user_id` | `uuid` |  Nullable |
| `created_at` | `timestamp` |  |

## Table `user_inventory`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` |  |
| `product_id` | `uuid` |  |
| `quantity` | `int4` |  |

## Table `users`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `mobile` | `varchar` |  Unique |
| `password_hash` | `varchar` |  |
| `avatar_url` | `text` |  Nullable |
| `name` | `varchar` |  Nullable |
| `nickname` | `varchar` |  Nullable |
| `last_active_at` | `timestamp` |  Nullable |
| `created_at` | `timestamp` |  |
| `updated_at` | `timestamp` |  |

## Table `wallet_accounts`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` |  Nullable |
| `currency` | `varchar` |  |
| `balance` | `int8` |  |
| `created_at` | `timestamp` |  |
| `updated_at` | `timestamp` |  |

## Table `wallet_transactions`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `account_id` | `uuid` |  Nullable |
| `user_id` | `uuid` |  Nullable |
| `type` | `varchar` |  |
| `amount` | `int8` |  |
| `currency` | `varchar` |  |
| `counterparty_user_id` | `uuid` |  Nullable |
| `product_id` | `uuid` |  Nullable |
| `note` | `text` |  Nullable |
| `created_at` | `timestamp` |  |
| `listing_id` | `uuid` |  Nullable |
| `offer_id` | `uuid` |  Nullable |