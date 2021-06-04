import { CompressionType } from 'app/enums/compression-type.enum';
import { Direction } from 'app/enums/direction.enum';
import { EncryptionKeyFormat } from 'app/enums/encryption-key-format.enum';
import { LifetimeUnit } from 'app/enums/lifetime-unit.enum';
import { LoggingLevel } from 'app/enums/logging-level.enum';
import { NetcatMode } from 'app/enums/netcat-mode.enum';
import { ReadOnlyMode } from 'app/enums/readonly-mode.enum';
import { RetentionPolicy } from 'app/enums/retention-policy.enum';
import { ScheduleMethod } from 'app/enums/schedule-method.enum';
import { TransportMode } from 'app/enums/transport-mode.enum';
import { EntityJob } from 'app/interfaces/entity-job.interface';
import { PeriodicSnapshotTask } from 'app/interfaces/periodic-snapshot-task.interface';
import { Schedule } from 'app/interfaces/schedule.interface';
import { SshCredentials } from 'app/interfaces/ssh-credentials.interface';

import { DataProtectionTaskState } from './data-protection-task-state.interface';

export interface ReplicationTask {
  allow_from_scratch?: boolean;
  also_include_naming_schema?: string[];
  auto: boolean;
  compressed?: boolean;
  compression?: CompressionType;
  direction: Direction;
  embed?: boolean;
  enabled?: boolean;
  encryption?: boolean;
  encryption_key?: string;
  encryption_key_format?: EncryptionKeyFormat;
  encryption_key_location?: string;
  exclude?: string[];
  hold_pending_snapshots?: boolean;
  id: number;
  job?: EntityJob;
  large_block?: boolean;
  lifetime_unit?: LifetimeUnit;
  lifetime_value?: number;
  logging_level?: LoggingLevel;
  name: string;
  naming_schema?: string[];
  netcat_active_side?: NetcatMode;
  netcat_active_side_listen_address?: string;
  netcat_active_side_port_max?: number;
  netcat_active_side_port_min?: number;
  netcat_passive_side_connect_address?: string;
  only_matching_schedule?: boolean;
  periodic_snapshot_tasks?: number[] | PeriodicSnapshotTask[];
  properties?: boolean;
  properties_exclude?: string[];
  properties_override?: {};
  readonly?: ReadOnlyMode;
  recursive: boolean;
  replicate?: boolean;
  restrict_schedule?: Schedule;
  retention_policy: RetentionPolicy;
  retries?: number;
  schedule?: Schedule | boolean;
  schedule_method: ScheduleMethod;
  schedule_picker: string;
  source_datasets?: string[];
  source_datasets_from: string;
  speed_limit?: number;
  ssh_credentials?: SshCredentials | number[];
  state: DataProtectionTaskState;
  target_dataset: string;
  target_dataset_from: string;
  transport: TransportMode;
}

export interface ReplicationTaskUi extends ReplicationTask {
  ssh_connection: string;
  task_last_snapshot: string;
}
