export enum MessageType {
  Error = 'error',
  Request = 'request',
  History = 'history',
  Update = 'update'
}
// TODO: expand the api to query for available lines.
// this is hardcoded for now
export type Line = 0 | 1;
export type RecordSourceName = string;
export type SourceMetadata = {
  id: string,
  name?: string,
  min: number,
  max: number,
  mean: number,
}
export type Record = [number, ...(number[])]
export type HistoryMessage = {
  type: MessageType.History,
  data: {
    name: RecordSourceName,
    metadata: SourceMetadata[],
    data: Record[]
  }[]
}
export type UpdateMessage = {
  type: MessageType.Update,
  data: {
    sourceName: RecordSourceName,
    data: Record
  }
}
export type ErrorMessage = {
  type: MessageType.Error,
  data: string
}
export type LIVE = 'live';
export const LIVE = 'live';
export type TimeAnchor = {
  start ?: number,
  span ?: number,
  end ?: number | LIVE,
}
export type RequestOptions = {
  line: Line,
  anchor: TimeAnchor
}
export type RequestMessage = {
  type: MessageType.Request,
  data: RequestOptions
}
export type SocketRequest = RequestMessage;
export type SocketResponse = ErrorMessage | UpdateMessage | HistoryMessage;

