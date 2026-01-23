import type * as types from './types';
import type { ConfigOptions, FetchResponse } from 'api/dist/core'
import Oas from 'oas';
import APICore from 'api/dist/core';
import definition from './openapi.json';

class SDK {
  spec: Oas;
  core: APICore;

  constructor() {
    this.spec = Oas.init(definition);
    this.core = new APICore(this.spec, 'birdeyedotso/1.1.0 (api/6.1.3)');
  }

  /**
   * Optionally configure various options that the SDK allows.
   *
   * @param config Object of supported SDK options and toggles.
   * @param config.timeout Override the default `fetch` request timeout of 30 seconds. This number
   * should be represented in milliseconds.
   */
  config(config: ConfigOptions) {
    this.core.setConfig(config);
  }

  /**
   * If the API you're using requires authentication you can supply the required credentials
   * through this method and the library will magically determine how they should be used
   * within your API request.
   *
   * With the exception of OpenID and MutualTLS, it supports all forms of authentication
   * supported by the OpenAPI specification.
   *
   * @example <caption>HTTP Basic auth</caption>
   * sdk.auth('username', 'password');
   *
   * @example <caption>Bearer tokens (HTTP or OAuth 2)</caption>
   * sdk.auth('myBearerToken');
   *
   * @example <caption>API Keys</caption>
   * sdk.auth('myApiKey');
   *
   * @see {@link https://spec.openapis.org/oas/v3.0.3#fixed-fields-22}
   * @see {@link https://spec.openapis.org/oas/v3.1.0#fixed-fields-22}
   * @param values Your auth credentials for the API; can specify up to two strings or numbers.
   */
  auth(...values: string[] | number[]) {
    this.core.setAuth(...values);
    return this;
  }

  /**
   * If the API you're using offers alternate server URLs, and server variables, you can tell
   * the SDK which one to use with this method. To use it you can supply either one of the
   * server URLs that are contained within the OpenAPI definition (along with any server
   * variables), or you can pass it a fully qualified URL to use (that may or may not exist
   * within the OpenAPI definition).
   *
   * @example <caption>Server URL with server variables</caption>
   * sdk.server('https://{region}.api.example.com/{basePath}', {
   *   name: 'eu',
   *   basePath: 'v14',
   * });
   *
   * @example <caption>Fully qualified server URL</caption>
   * sdk.server('https://eu.api.example.com/v14');
   *
   * @param url Server URL
   * @param variables An object of variables to replace into the server URL.
   */
  server(url: string, variables = {}) {
    this.core.setServer(url, variables);
  }

  /**
   * Retrieve the latest price information for a specified token.
   *
   * @summary Price
   * @throws FetchError<400, types.GetDefiPriceResponse400> Bad Request
   * @throws FetchError<401, types.GetDefiPriceResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetDefiPriceResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetDefiPriceResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetDefiPriceResponse500> Internal Server Error
   */
  getDefiPrice(metadata: types.GetDefiPriceMetadataParam): Promise<FetchResponse<200, types.GetDefiPriceResponse200>> {
    return this.core.fetch('/defi/price', 'get', metadata);
  }

  /**
   * Retrieve the latest price information for multiple tokens. Maximum 100 tokens
   *
   * @summary Price - Multiple
   * @throws FetchError<400, types.GetDefiMultiPriceResponse400> Bad Request
   * @throws FetchError<401, types.GetDefiMultiPriceResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetDefiMultiPriceResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetDefiMultiPriceResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetDefiMultiPriceResponse500> Internal Server Error
   */
  getDefiMulti_price(metadata: types.GetDefiMultiPriceMetadataParam): Promise<FetchResponse<200, types.GetDefiMultiPriceResponse200>> {
    return this.core.fetch('/defi/multi_price', 'get', metadata);
  }

  /**
   * Retrieve the latest price information for multiple tokens. Maximum 100 tokens
   *
   * @summary Price - Multiple
   * @throws FetchError<400, types.PostDefiMultiPriceResponse400> Bad Request
   * @throws FetchError<401, types.PostDefiMultiPriceResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.PostDefiMultiPriceResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.PostDefiMultiPriceResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.PostDefiMultiPriceResponse500> Internal Server Error
   */
  postDefiMulti_price(body: types.PostDefiMultiPriceBodyParam, metadata?: types.PostDefiMultiPriceMetadataParam): Promise<FetchResponse<200, types.PostDefiMultiPriceResponse200>> {
    return this.core.fetch('/defi/multi_price', 'post', body, metadata);
  }

  /**
   * Retrieve a list of trades of a specified token.
   *
   * @summary Trades - Token
   * @throws FetchError<400, types.GetDefiTxsTokenResponse400> Bad Request
   * @throws FetchError<401, types.GetDefiTxsTokenResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetDefiTxsTokenResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetDefiTxsTokenResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetDefiTxsTokenResponse500> Internal Server Error
   */
  getDefiTxsToken(metadata: types.GetDefiTxsTokenMetadataParam): Promise<FetchResponse<200, types.GetDefiTxsTokenResponse200>> {
    return this.core.fetch('/defi/txs/token', 'get', metadata);
  }

  /**
   * Retrieve a list of trades of a specified pair.
   *
   * @summary Trades - Pair
   * @throws FetchError<400, types.GetDefiTxsPairResponse400> Bad Request
   * @throws FetchError<401, types.GetDefiTxsPairResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetDefiTxsPairResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetDefiTxsPairResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetDefiTxsPairResponse500> Internal Server Error
   */
  getDefiTxsPair(metadata: types.GetDefiTxsPairMetadataParam): Promise<FetchResponse<200, types.GetDefiTxsPairResponse200>> {
    return this.core.fetch('/defi/txs/pair', 'get', metadata);
  }

  /**
   * Retrieve a list of trades of a specified token with time bound option.
   *
   * @summary Trades - Token Seek By Time
   * @throws FetchError<400, types.GetDefiTxsTokenSeekByTimeResponse400> Bad Request
   * @throws FetchError<401, types.GetDefiTxsTokenSeekByTimeResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetDefiTxsTokenSeekByTimeResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetDefiTxsTokenSeekByTimeResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetDefiTxsTokenSeekByTimeResponse500> Internal Server Error
   */
  getDefiTxsTokenSeek_by_time(metadata: types.GetDefiTxsTokenSeekByTimeMetadataParam): Promise<FetchResponse<200, types.GetDefiTxsTokenSeekByTimeResponse200>> {
    return this.core.fetch('/defi/txs/token/seek_by_time', 'get', metadata);
  }

  /**
   * Retrieve a list of trades of a specified pair with time bound option.
   *
   * @summary Trades - Pair Seek By Time
   * @throws FetchError<400, types.GetDefiTxsPairSeekByTimeResponse400> Bad Request
   * @throws FetchError<401, types.GetDefiTxsPairSeekByTimeResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetDefiTxsPairSeekByTimeResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetDefiTxsPairSeekByTimeResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetDefiTxsPairSeekByTimeResponse500> Internal Server Error
   */
  getDefiTxsPairSeek_by_time(metadata: types.GetDefiTxsPairSeekByTimeMetadataParam): Promise<FetchResponse<200, types.GetDefiTxsPairSeekByTimeResponse200>> {
    return this.core.fetch('/defi/txs/pair/seek_by_time', 'get', metadata);
  }

  /**
   * Retrieve a list of trades with various filters.
   *
   * @summary Trades - All (V3)
   * @throws FetchError<400, types.GetDefiV3TxsResponse400> Bad Request
   * @throws FetchError<401, types.GetDefiV3TxsResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetDefiV3TxsResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetDefiV3TxsResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetDefiV3TxsResponse500> Internal Server Error
   */
  getDefiV3Txs(metadata?: types.GetDefiV3TxsMetadataParam): Promise<FetchResponse<200, types.GetDefiV3TxsResponse200>> {
    return this.core.fetch('/defi/v3/txs', 'get', metadata);
  }

  /**
   * Retrieve a list of trades with various filters of a specified token.
   *
   * @summary Trades - Token (V3)
   * @throws FetchError<400, types.GetDefiV3TokenTxsResponse400> Bad Request
   * @throws FetchError<401, types.GetDefiV3TokenTxsResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetDefiV3TokenTxsResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetDefiV3TokenTxsResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetDefiV3TokenTxsResponse500> Internal Server Error
   */
  getDefiV3TokenTxs(metadata: types.GetDefiV3TokenTxsMetadataParam): Promise<FetchResponse<200, types.GetDefiV3TokenTxsResponse200>> {
    return this.core.fetch('/defi/v3/token/txs', 'get', metadata);
  }

  /**
   * Retrieve a list of recent trades.
   *
   * @summary Trades - Recent (V3)
   * @throws FetchError<400, types.GetDefiV3TxsRecentResponse400> Bad Request
   * @throws FetchError<401, types.GetDefiV3TxsRecentResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetDefiV3TxsRecentResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetDefiV3TxsRecentResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetDefiV3TxsRecentResponse500> Internal Server Error
   */
  getDefiV3TxsRecent(metadata?: types.GetDefiV3TxsRecentMetadataParam): Promise<FetchResponse<200, types.GetDefiV3TxsRecentResponse200>> {
    return this.core.fetch('/defi/v3/txs/recent', 'get', metadata);
  }

  /**
   * Retrieve candlestick data in OHLCV format of a specified token. Maximum 1000 records.
   *
   * @summary OHLCV
   * @throws FetchError<400, types.GetDefiOhlcvResponse400> Bad Request
   * @throws FetchError<401, types.GetDefiOhlcvResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetDefiOhlcvResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetDefiOhlcvResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetDefiOhlcvResponse500> Internal Server Error
   */
  getDefiOhlcv(metadata: types.GetDefiOhlcvMetadataParam): Promise<FetchResponse<200, types.GetDefiOhlcvResponse200>> {
    return this.core.fetch('/defi/ohlcv', 'get', metadata);
  }

  /**
   * Retrieve candlestick data in OHLCV format of a specified pair. Maximum 1000 records.
   *
   * @summary OHLCV - Pair
   * @throws FetchError<400, types.GetDefiOhlcvPairResponse400> Bad Request
   * @throws FetchError<401, types.GetDefiOhlcvPairResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetDefiOhlcvPairResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetDefiOhlcvPairResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetDefiOhlcvPairResponse500> Internal Server Error
   */
  getDefiOhlcvPair(metadata: types.GetDefiOhlcvPairMetadataParam): Promise<FetchResponse<200, types.GetDefiOhlcvPairResponse200>> {
    return this.core.fetch('/defi/ohlcv/pair', 'get', metadata);
  }

  /**
   * Retrieve candlestick data in OHLCV format of a specified base-quote pair. Maximum 1000
   * records.
   *
   * @summary OHLCV - Base/Quote
   * @throws FetchError<400, types.GetDefiOhlcvBaseQuoteResponse400> Bad Request
   * @throws FetchError<401, types.GetDefiOhlcvBaseQuoteResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetDefiOhlcvBaseQuoteResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetDefiOhlcvBaseQuoteResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetDefiOhlcvBaseQuoteResponse500> Internal Server Error
   */
  getDefiOhlcvBase_quote(metadata: types.GetDefiOhlcvBaseQuoteMetadataParam): Promise<FetchResponse<200, types.GetDefiOhlcvBaseQuoteResponse200>> {
    return this.core.fetch('/defi/ohlcv/base_quote', 'get', metadata);
  }

  /**
   * Retrieve candlestick data in OHLCV format of a specified token. Maximum 5000 records.
   * Compared to v1: Added 1s, 15s, and 30s intervals and no candle padding
   *
   * @summary OHLCV V3
   * @throws FetchError<400, types.GetDefiV3OhlcvResponse400> Bad Request
   * @throws FetchError<401, types.GetDefiV3OhlcvResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetDefiV3OhlcvResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetDefiV3OhlcvResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetDefiV3OhlcvResponse500> Internal Server Error
   */
  getDefiV3Ohlcv(metadata: types.GetDefiV3OhlcvMetadataParam): Promise<FetchResponse<200, types.GetDefiV3OhlcvResponse200>> {
    return this.core.fetch('/defi/v3/ohlcv', 'get', metadata);
  }

  /**
   * Retrieve candlestick data in OHLCV format of a specified pair. Maximum 5000 records.
   * Compared to v1: Added 1s, 15s, and 30s intervals and no candle padding
   *
   * @summary OHLCV V3 - Pair
   * @throws FetchError<400, types.GetDefiV3OhlcvPairResponse400> Bad Request
   * @throws FetchError<401, types.GetDefiV3OhlcvPairResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetDefiV3OhlcvPairResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetDefiV3OhlcvPairResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetDefiV3OhlcvPairResponse500> Internal Server Error
   */
  getDefiV3OhlcvPair(metadata: types.GetDefiV3OhlcvPairMetadataParam): Promise<FetchResponse<200, types.GetDefiV3OhlcvPairResponse200>> {
    return this.core.fetch('/defi/v3/ohlcv/pair', 'get', metadata);
  }

  /**
   * Retrieve historical price line chart of a specified token.
   *
   * @summary Price - Historical
   * @throws FetchError<400, types.GetDefiHistoryPriceResponse400> Bad Request
   * @throws FetchError<401, types.GetDefiHistoryPriceResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetDefiHistoryPriceResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetDefiHistoryPriceResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetDefiHistoryPriceResponse500> Internal Server Error
   */
  getDefiHistory_price(metadata: types.GetDefiHistoryPriceMetadataParam): Promise<FetchResponse<200, types.GetDefiHistoryPriceResponse200>> {
    return this.core.fetch('/defi/history_price', 'get', metadata);
  }

  /**
   * Retrieve historical price by unix timestamp.
   *
   * @summary Price - Historical by unix time
   * @throws FetchError<400, types.GetDefiHistoricalPriceUnixResponse400> Bad Request
   * @throws FetchError<401, types.GetDefiHistoricalPriceUnixResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetDefiHistoricalPriceUnixResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetDefiHistoricalPriceUnixResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetDefiHistoricalPriceUnixResponse500> Internal Server Error
   */
  getDefiHistorical_price_unix(metadata: types.GetDefiHistoricalPriceUnixMetadataParam): Promise<FetchResponse<200, types.GetDefiHistoricalPriceUnixResponse200>> {
    return this.core.fetch('/defi/historical_price_unix', 'get', metadata);
  }

  /**
   * Retrieve price and volume updates of a specified token.
   *
   * @summary Price Volume - Single
   * @throws FetchError<400, types.GetDefiPriceVolumeSingleResponse400> Bad Request
   * @throws FetchError<401, types.GetDefiPriceVolumeSingleResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetDefiPriceVolumeSingleResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetDefiPriceVolumeSingleResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetDefiPriceVolumeSingleResponse500> Internal Server Error
   */
  getDefiPrice_volumeSingle(metadata: types.GetDefiPriceVolumeSingleMetadataParam): Promise<FetchResponse<200, types.GetDefiPriceVolumeSingleResponse200>> {
    return this.core.fetch('/defi/price_volume/single', 'get', metadata);
  }

  /**
   * Retrieve price and volume updates of multiple tokens. Maximum 50 tokens.
   *
   * @summary Price Volume - Multi
   * @throws FetchError<400, types.PostDefiPriceVolumeMultiResponse400> Bad Request
   * @throws FetchError<401, types.PostDefiPriceVolumeMultiResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.PostDefiPriceVolumeMultiResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.PostDefiPriceVolumeMultiResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.PostDefiPriceVolumeMultiResponse500> Internal Server Error
   */
  postDefiPrice_volumeMulti(body: types.PostDefiPriceVolumeMultiBodyParam, metadata?: types.PostDefiPriceVolumeMultiMetadataParam): Promise<FetchResponse<200, types.PostDefiPriceVolumeMultiResponse200>> {
    return this.core.fetch('/defi/price_volume/multi', 'post', body, metadata);
  }

  /**
   * Retrieve stats of a specified pair.
   *
   * @summary Pair - Pair Overview (Single)
   * @throws FetchError<400, types.GetDefiV3PairOverviewSingleResponse400> Bad Request
   * @throws FetchError<401, types.GetDefiV3PairOverviewSingleResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetDefiV3PairOverviewSingleResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetDefiV3PairOverviewSingleResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetDefiV3PairOverviewSingleResponse500> Internal Server Error
   */
  getDefiV3PairOverviewSingle(metadata: types.GetDefiV3PairOverviewSingleMetadataParam): Promise<FetchResponse<200, types.GetDefiV3PairOverviewSingleResponse200>> {
    return this.core.fetch('/defi/v3/pair/overview/single', 'get', metadata);
  }

  /**
   * Retrieve stats of multiple pairs. Maximum 20 addresses.
   *
   * @summary Pair - Pair Overview (Multiple)
   * @throws FetchError<400, types.GetDefiV3PairOverviewMultipleResponse400> Bad Request
   * @throws FetchError<401, types.GetDefiV3PairOverviewMultipleResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetDefiV3PairOverviewMultipleResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetDefiV3PairOverviewMultipleResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetDefiV3PairOverviewMultipleResponse500> Internal Server Error
   */
  getDefiV3PairOverviewMultiple(metadata: types.GetDefiV3PairOverviewMultipleMetadataParam): Promise<FetchResponse<200, types.GetDefiV3PairOverviewMultipleResponse200>> {
    return this.core.fetch('/defi/v3/pair/overview/multiple', 'get', metadata);
  }

  /**
   * Get the price stats (current price, high/low, percentage change) by time frame for one
   * token
   *
   * @summary Price stats (Single)
   * @throws FetchError<400, types.GetDefiV3PriceStatsSingleResponse400> Bad Request
   * @throws FetchError<401, types.GetDefiV3PriceStatsSingleResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetDefiV3PriceStatsSingleResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetDefiV3PriceStatsSingleResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetDefiV3PriceStatsSingleResponse500> Internal Server Error
   */
  getDefiV3PriceStatsSingle(metadata: types.GetDefiV3PriceStatsSingleMetadataParam): Promise<FetchResponse<200, types.GetDefiV3PriceStatsSingleResponse200>> {
    return this.core.fetch('/defi/v3/price/stats/single', 'get', metadata);
  }

  /**
   * Get the price stats (current price, high/low, percentage change) by time frame for
   * multiple tokens. Max to 20 tokens
   *
   * @summary Price stats (Multiple)
   * @throws FetchError<400, types.PostDefiV3PriceStatsMultipleResponse400> Bad Request
   * @throws FetchError<401, types.PostDefiV3PriceStatsMultipleResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.PostDefiV3PriceStatsMultipleResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.PostDefiV3PriceStatsMultipleResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.PostDefiV3PriceStatsMultipleResponse500> Internal Server Error
   */
  postDefiV3PriceStatsMultiple(body: types.PostDefiV3PriceStatsMultipleBodyParam, metadata?: types.PostDefiV3PriceStatsMultipleMetadataParam): Promise<FetchResponse<200, types.PostDefiV3PriceStatsMultipleResponse200>> {
    return this.core.fetch('/defi/v3/price/stats/multiple', 'post', body, metadata);
  }

  /**
   * Retrieve a list of trades with various filters of a specified token with volume (value).
   *
   * @summary Trades - Token Filtered By Volume (V3)
   * @throws FetchError<400, types.GetDefiV3TokenTxsByVolumeResponse400> Bad Request
   * @throws FetchError<401, types.GetDefiV3TokenTxsByVolumeResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetDefiV3TokenTxsByVolumeResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetDefiV3TokenTxsByVolumeResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetDefiV3TokenTxsByVolumeResponse500> Internal Server Error
   */
  getDefiV3TokenTxsByVolume(metadata: types.GetDefiV3TokenTxsByVolumeMetadataParam): Promise<FetchResponse<200, types.GetDefiV3TokenTxsByVolumeResponse200>> {
    return this.core.fetch('/defi/v3/token/txs-by-volume', 'get', metadata);
  }

  /**
   * Retrieve a list of tokens on a specified chain.
   *
   * @summary Token - List (V1)
   * @throws FetchError<400, types.GetDefiTokenlistResponse400> Bad Request
   * @throws FetchError<401, types.GetDefiTokenlistResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetDefiTokenlistResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetDefiTokenlistResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetDefiTokenlistResponse500> Internal Server Error
   */
  getDefiTokenlist(metadata: types.GetDefiTokenlistMetadataParam): Promise<FetchResponse<200, types.GetDefiTokenlistResponse200>> {
    return this.core.fetch('/defi/tokenlist', 'get', metadata);
  }

  /**
   * Retrieve a list of tokens on a specified chain.
   *
   * @summary Token - List (V3)
   * @throws FetchError<400, types.GetDefiV3TokenListResponse400> Bad Request
   * @throws FetchError<401, types.GetDefiV3TokenListResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetDefiV3TokenListResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetDefiV3TokenListResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetDefiV3TokenListResponse500> Internal Server Error
   */
  getDefiV3TokenList(metadata: types.GetDefiV3TokenListMetadataParam): Promise<FetchResponse<200, types.GetDefiV3TokenListResponse200>> {
    return this.core.fetch('/defi/v3/token/list', 'get', metadata);
  }

  /**
   * Retrieve up to 5,000 tokens per batch. For the first request, apply any filter
   * parameters except scroll_id. For subsequent requests, provide only the scroll_id
   * parameter using the next_scroll_id value returned previously. Limited to 1 scroll_id per
   * account per 30 seconds.
   *
   * @summary Token - List (V3) Scroll
   * @throws FetchError<400, types.GetDefiV3TokenListScrollResponse400> Bad Request
   * @throws FetchError<401, types.GetDefiV3TokenListScrollResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetDefiV3TokenListScrollResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetDefiV3TokenListScrollResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetDefiV3TokenListScrollResponse500> Internal Server Error
   */
  getDefiV3TokenListScroll(metadata: types.GetDefiV3TokenListScrollMetadataParam): Promise<FetchResponse<200, types.GetDefiV3TokenListScrollResponse200>> {
    return this.core.fetch('/defi/v3/token/list/scroll', 'get', metadata);
  }

  /**
   * Retrieve stats of a specified token.
   *
   * @summary Token - Overview
   * @throws FetchError<400, types.GetDefiTokenOverviewResponse400> Bad Request
   * @throws FetchError<401, types.GetDefiTokenOverviewResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetDefiTokenOverviewResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetDefiTokenOverviewResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetDefiTokenOverviewResponse500> Internal Server Error
   */
  getDefiToken_overview(metadata: types.GetDefiTokenOverviewMetadataParam): Promise<FetchResponse<200, types.GetDefiTokenOverviewResponse200>> {
    return this.core.fetch('/defi/token_overview', 'get', metadata);
  }

  /**
   * Retrieve metadata of a specified token.
   *
   * @summary Token - Metadata (Single)
   * @throws FetchError<400, types.GetDefiV3TokenMetaDataSingleResponse400> Bad Request
   * @throws FetchError<401, types.GetDefiV3TokenMetaDataSingleResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetDefiV3TokenMetaDataSingleResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetDefiV3TokenMetaDataSingleResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetDefiV3TokenMetaDataSingleResponse500> Internal Server Error
   */
  getDefiV3TokenMetaDataSingle(metadata: types.GetDefiV3TokenMetaDataSingleMetadataParam): Promise<FetchResponse<200, types.GetDefiV3TokenMetaDataSingleResponse200>> {
    return this.core.fetch('/defi/v3/token/meta-data/single', 'get', metadata);
  }

  /**
   * Retrieve metadata of multiple tokens. Maximum 50 addresses.
   *
   * @summary Token - Metadata (Multiple)
   * @throws FetchError<400, types.GetDefiV3TokenMetaDataMultipleResponse400> Bad Request
   * @throws FetchError<401, types.GetDefiV3TokenMetaDataMultipleResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetDefiV3TokenMetaDataMultipleResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetDefiV3TokenMetaDataMultipleResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetDefiV3TokenMetaDataMultipleResponse500> Internal Server Error
   */
  getDefiV3TokenMetaDataMultiple(metadata: types.GetDefiV3TokenMetaDataMultipleMetadataParam): Promise<FetchResponse<200, types.GetDefiV3TokenMetaDataMultipleResponse200>> {
    return this.core.fetch('/defi/v3/token/meta-data/multiple', 'get', metadata);
  }

  /**
   * Retrieve market data of a specified token.
   *
   * @summary Token - Market Data (Single)
   * @throws FetchError<400, types.GetDefiV3TokenMarketDataResponse400> Bad Request
   * @throws FetchError<401, types.GetDefiV3TokenMarketDataResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetDefiV3TokenMarketDataResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetDefiV3TokenMarketDataResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetDefiV3TokenMarketDataResponse500> Internal Server Error
   */
  getDefiV3TokenMarketData(metadata: types.GetDefiV3TokenMarketDataMetadataParam): Promise<FetchResponse<200, types.GetDefiV3TokenMarketDataResponse200>> {
    return this.core.fetch('/defi/v3/token/market-data', 'get', metadata);
  }

  /**
   * Retrieve market data of multiple tokens. Maximum 20 addresses.
   *
   * @summary Token - Market Data (Multiple)
   * @throws FetchError<400, types.GetDefiV3TokenMarketDataMultipleResponse400> Bad Request
   * @throws FetchError<401, types.GetDefiV3TokenMarketDataMultipleResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetDefiV3TokenMarketDataMultipleResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetDefiV3TokenMarketDataMultipleResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetDefiV3TokenMarketDataMultipleResponse500> Internal Server Error
   */
  getDefiV3TokenMarketDataMultiple(metadata: types.GetDefiV3TokenMarketDataMultipleMetadataParam): Promise<FetchResponse<200, types.GetDefiV3TokenMarketDataMultipleResponse200>> {
    return this.core.fetch('/defi/v3/token/market-data/multiple', 'get', metadata);
  }

  /**
   * Retrieve trade data of a specified token.
   *
   * @summary Token - Trade Data (Single)
   * @throws FetchError<400, types.GetDefiV3TokenTradeDataSingleResponse400> Bad Request
   * @throws FetchError<401, types.GetDefiV3TokenTradeDataSingleResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetDefiV3TokenTradeDataSingleResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetDefiV3TokenTradeDataSingleResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetDefiV3TokenTradeDataSingleResponse500> Internal Server Error
   */
  getDefiV3TokenTradeDataSingle(metadata: types.GetDefiV3TokenTradeDataSingleMetadataParam): Promise<FetchResponse<200, types.GetDefiV3TokenTradeDataSingleResponse200>> {
    return this.core.fetch('/defi/v3/token/trade-data/single', 'get', metadata);
  }

  /**
   * Retrieve trade data of multiple tokens. Maximum 20 addresses.
   *
   * @summary Token - Trade Data (Multiple)
   * @throws FetchError<400, types.GetDefiV3TokenTradeDataMultipleResponse400> Bad Request
   * @throws FetchError<401, types.GetDefiV3TokenTradeDataMultipleResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetDefiV3TokenTradeDataMultipleResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetDefiV3TokenTradeDataMultipleResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetDefiV3TokenTradeDataMultipleResponse500> Internal Server Error
   */
  getDefiV3TokenTradeDataMultiple(metadata: types.GetDefiV3TokenTradeDataMultipleMetadataParam): Promise<FetchResponse<200, types.GetDefiV3TokenTradeDataMultipleResponse200>> {
    return this.core.fetch('/defi/v3/token/trade-data/multiple', 'get', metadata);
  }

  /**
   * Retrieve a list of top holders of a specified token.
   *
   * @summary Token - Holder
   * @throws FetchError<400, types.GetDefiV3TokenHolderResponse400> Bad Request
   * @throws FetchError<401, types.GetDefiV3TokenHolderResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetDefiV3TokenHolderResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetDefiV3TokenHolderResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetDefiV3TokenHolderResponse500> Internal Server Error
   */
  getDefiV3TokenHolder(metadata: types.GetDefiV3TokenHolderMetadataParam): Promise<FetchResponse<200, types.GetDefiV3TokenHolderResponse200>> {
    return this.core.fetch('/defi/v3/token/holder', 'get', metadata);
  }

  /**
   * Retrieve a dynamic and up-to-date list of trending tokens based on specified sorting
   * criteria.
   *
   * @summary Token - Trending List
   * @throws FetchError<400, types.GetDefiTokenTrendingResponse400> Bad Request
   * @throws FetchError<401, types.GetDefiTokenTrendingResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetDefiTokenTrendingResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetDefiTokenTrendingResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetDefiTokenTrendingResponse500> Internal Server Error
   */
  getDefiToken_trending(metadata: types.GetDefiTokenTrendingMetadataParam): Promise<FetchResponse<200, types.GetDefiTokenTrendingResponse200>> {
    return this.core.fetch('/defi/token_trending', 'get', metadata);
  }

  /**
   * Retrieve a list of newly listed tokens.
   *
   * @summary Token - New listing
   * @throws FetchError<400, types.GetDefiV2TokensNewListingResponse400> Bad Request
   * @throws FetchError<401, types.GetDefiV2TokensNewListingResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetDefiV2TokensNewListingResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetDefiV2TokensNewListingResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetDefiV2TokensNewListingResponse500> Internal Server Error
   */
  getDefiV2TokensNew_listing(metadata?: types.GetDefiV2TokensNewListingMetadataParam): Promise<FetchResponse<200, types.GetDefiV2TokensNewListingResponse200>> {
    return this.core.fetch('/defi/v2/tokens/new_listing', 'get', metadata);
  }

  /**
   * Retrieve a list of top traders of a specified token.
   *
   * @summary Token - Top traders
   * @throws FetchError<400, types.GetDefiV2TokensTopTradersResponse400> Bad Request
   * @throws FetchError<401, types.GetDefiV2TokensTopTradersResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetDefiV2TokensTopTradersResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetDefiV2TokensTopTradersResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetDefiV2TokensTopTradersResponse500> Internal Server Error
   */
  getDefiV2TokensTop_traders(metadata: types.GetDefiV2TokensTopTradersMetadataParam): Promise<FetchResponse<200, types.GetDefiV2TokensTopTradersResponse200>> {
    return this.core.fetch('/defi/v2/tokens/top_traders', 'get', metadata);
  }

  /**
   * Retrieve a list of markets for a specified token.
   *
   * @summary Token - All Market List
   * @throws FetchError<400, types.GetDefiV2MarketsResponse400> Bad Request
   * @throws FetchError<401, types.GetDefiV2MarketsResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetDefiV2MarketsResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetDefiV2MarketsResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetDefiV2MarketsResponse500> Internal Server Error
   */
  getDefiV2Markets(metadata: types.GetDefiV2MarketsMetadataParam): Promise<FetchResponse<200, types.GetDefiV2MarketsResponse200>> {
    return this.core.fetch('/defi/v2/markets', 'get', metadata);
  }

  /**
   * Retrieve security information of a specified token.
   *
   * @summary Token - Security
   * @throws FetchError<400, types.GetDefiTokenSecurityResponse400> Bad Request
   * @throws FetchError<401, types.GetDefiTokenSecurityResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetDefiTokenSecurityResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetDefiTokenSecurityResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetDefiTokenSecurityResponse500> Internal Server Error
   */
  getDefiToken_security(metadata: types.GetDefiTokenSecurityMetadataParam): Promise<FetchResponse<200, types.GetDefiTokenSecurityResponse200>> {
    return this.core.fetch('/defi/token_security', 'get', metadata);
  }

  /**
   * Retrieve the creation transaction information of a specified token
   *
   * @summary Token - Creation Token Info
   * @throws FetchError<400, types.GetDefiTokenCreationInfoResponse400> Bad Request
   * @throws FetchError<401, types.GetDefiTokenCreationInfoResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetDefiTokenCreationInfoResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetDefiTokenCreationInfoResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetDefiTokenCreationInfoResponse500> Internal Server Error
   */
  getDefiToken_creation_info(metadata: types.GetDefiTokenCreationInfoMetadataParam): Promise<FetchResponse<200, types.GetDefiTokenCreationInfoResponse200>> {
    return this.core.fetch('/defi/token_creation_info', 'get', metadata);
  }

  /**
   * Retrieve the mint/burn transaction list of a specified token. Only support solana
   *
   * @summary Token - Mint/Burn
   * @throws FetchError<400, types.GetDefiV3TokenMintBurnTxsResponse400> Bad Request
   * @throws FetchError<401, types.GetDefiV3TokenMintBurnTxsResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetDefiV3TokenMintBurnTxsResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetDefiV3TokenMintBurnTxsResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetDefiV3TokenMintBurnTxsResponse500> Internal Server Error
   */
  getDefiV3TokenMintBurnTxs(metadata: types.GetDefiV3TokenMintBurnTxsMetadataParam): Promise<FetchResponse<200, types.GetDefiV3TokenMintBurnTxsResponse200>> {
    return this.core.fetch('/defi/v3/token/mint-burn-txs', 'get', metadata);
  }

  /**
   * Get all time trades or follow duration transactions for one token.
   *
   * @summary All Time Trades (Single)
   * @throws FetchError<400, types.GetDefiV3AllTimeTradesSingleResponse400> Bad Request
   * @throws FetchError<401, types.GetDefiV3AllTimeTradesSingleResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetDefiV3AllTimeTradesSingleResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetDefiV3AllTimeTradesSingleResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetDefiV3AllTimeTradesSingleResponse500> Internal Server Error
   */
  getDefiV3AllTimeTradesSingle(metadata: types.GetDefiV3AllTimeTradesSingleMetadataParam): Promise<FetchResponse<200, types.GetDefiV3AllTimeTradesSingleResponse200>> {
    return this.core.fetch('/defi/v3/all-time/trades/single', 'get', metadata);
  }

  /**
   * Get all time trades or follow duration transactions for multiple tokens. Max to 20
   * tokens
   *
   * @summary All Time Trades (Multiple)
   * @throws FetchError<400, types.PostDefiV3AllTimeTradesMultipleResponse400> Bad Request
   * @throws FetchError<401, types.PostDefiV3AllTimeTradesMultipleResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.PostDefiV3AllTimeTradesMultipleResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.PostDefiV3AllTimeTradesMultipleResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.PostDefiV3AllTimeTradesMultipleResponse500> Internal Server Error
   */
  postDefiV3AllTimeTradesMultiple(metadata: types.PostDefiV3AllTimeTradesMultipleMetadataParam): Promise<FetchResponse<200, types.PostDefiV3AllTimeTradesMultipleResponse200>> {
    return this.core.fetch('/defi/v3/all-time/trades/multiple', 'post', metadata);
  }

  /**
   * Provides a liquidity value based on USD, native tokens, and other high-liquidity assets
   * to confirm on-chain pools have real liquidity prior to user trades.
   *
   * @summary Token - Liquidity (Single)
   * @throws FetchError<400, types.GetDefiV3TokenExitLiquidityResponse400> Bad Request
   * @throws FetchError<401, types.GetDefiV3TokenExitLiquidityResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetDefiV3TokenExitLiquidityResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetDefiV3TokenExitLiquidityResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetDefiV3TokenExitLiquidityResponse500> Internal Server Error
   */
  getDefiV3TokenExitLiquidity(metadata: types.GetDefiV3TokenExitLiquidityMetadataParam): Promise<FetchResponse<200, types.GetDefiV3TokenExitLiquidityResponse200>> {
    return this.core.fetch('/defi/v3/token/exit-liquidity', 'get', metadata);
  }

  /**
   * Provides multiple tokens' liquidity value based on USD, native tokens, and other
   * high-liquidity assets to confirm on-chain pools have real liquidity prior to user
   * trades. Maximum 50 addresses.
   *
   * @summary Token - Liquidity (Multiple)
   * @throws FetchError<400, types.GetDefiV3TokenExitLiquidityMultipleResponse400> Bad Request
   * @throws FetchError<401, types.GetDefiV3TokenExitLiquidityMultipleResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetDefiV3TokenExitLiquidityMultipleResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetDefiV3TokenExitLiquidityMultipleResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetDefiV3TokenExitLiquidityMultipleResponse500> Internal Server Error
   */
  getDefiV3TokenExitLiquidityMultiple(metadata: types.GetDefiV3TokenExitLiquidityMultipleMetadataParam): Promise<FetchResponse<200, types.GetDefiV3TokenExitLiquidityMultipleResponse200>> {
    return this.core.fetch('/defi/v3/token/exit-liquidity/multiple', 'get', metadata);
  }

  /**
   * Retrieve the token balance held by a list of wallet owners.
   *
   * @summary Token - Holder (Batch)
   * @throws FetchError<400, types.PostTokenV1HolderBatchResponse400> Bad Request
   * @throws FetchError<401, types.PostTokenV1HolderBatchResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.PostTokenV1HolderBatchResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.PostTokenV1HolderBatchResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.PostTokenV1HolderBatchResponse500> Internal Server Error
   */
  postTokenV1HolderBatch(body: types.PostTokenV1HolderBatchBodyParam, metadata?: types.PostTokenV1HolderBatchMetadataParam): Promise<FetchResponse<200, types.PostTokenV1HolderBatchResponse200>> {
    return this.core.fetch('/token/v1/holder/batch', 'post', body, metadata);
  }

  /**
   * Get list of meme tokens
   *
   * @summary Meme Token - List
   * @throws FetchError<400, types.GetDefiV3TokenMemeListResponse400> Bad Request
   * @throws FetchError<401, types.GetDefiV3TokenMemeListResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetDefiV3TokenMemeListResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetDefiV3TokenMemeListResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetDefiV3TokenMemeListResponse500> Internal Server Error
   */
  getDefiV3TokenMemeList(metadata: types.GetDefiV3TokenMemeListMetadataParam): Promise<FetchResponse<200, types.GetDefiV3TokenMemeListResponse200>> {
    return this.core.fetch('/defi/v3/token/meme/list', 'get', metadata);
  }

  /**
   * Get detail of given meme token
   *
   * @summary Meme Token Detail - Single
   * @throws FetchError<400, types.GetDefiV3TokenMemeDetailSingleResponse400> Bad Request
   * @throws FetchError<401, types.GetDefiV3TokenMemeDetailSingleResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetDefiV3TokenMemeDetailSingleResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetDefiV3TokenMemeDetailSingleResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetDefiV3TokenMemeDetailSingleResponse500> Internal Server Error
   */
  getDefiV3TokenMemeDetailSingle(metadata: types.GetDefiV3TokenMemeDetailSingleMetadataParam): Promise<FetchResponse<200, types.GetDefiV3TokenMemeDetailSingleResponse200>> {
    return this.core.fetch('/defi/v3/token/meme/detail/single', 'get', metadata);
  }

  /**
   * Return a list of token transfer transactions for a specified token. Provide standardized
   * transaction data such as sender, receiver, amount, value, timestamp, and transaction
   * hash
   *
   * @summary Token - Transfer List
   * @throws FetchError<400, types.PostTokenV1TransferResponse400> Bad Request
   * @throws FetchError<401, types.PostTokenV1TransferResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.PostTokenV1TransferResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.PostTokenV1TransferResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.PostTokenV1TransferResponse500> Internal Server Error
   */
  postTokenV1Transfer(body: types.PostTokenV1TransferBodyParam, metadata?: types.PostTokenV1TransferMetadataParam): Promise<FetchResponse<200, types.PostTokenV1TransferResponse200>> {
    return this.core.fetch('/token/v1/transfer', 'post', body, metadata);
  }

  /**
   * Return a total number of token transfer transactions for a specified token with various
   * filters like time range, amount, value or source/destination wallet
   *
   * @summary Token - Transfer Total
   * @throws FetchError<400, types.PostTokenV1TransferTotalResponse400> Bad Request
   * @throws FetchError<401, types.PostTokenV1TransferTotalResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.PostTokenV1TransferTotalResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.PostTokenV1TransferTotalResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.PostTokenV1TransferTotalResponse500> Internal Server Error
   */
  postTokenV1TransferTotal(body: types.PostTokenV1TransferTotalBodyParam, metadata?: types.PostTokenV1TransferTotalMetadataParam): Promise<FetchResponse<200, types.PostTokenV1TransferTotalResponse200>> {
    return this.core.fetch('/token/v1/transfer/total', 'post', body, metadata);
  }

  /**
   * Retrieve distribution statistics for token holders based on their share of the total
   * supply. Set include_list=true to return the wallet list for the specified range.
   *
   * @summary Token - Holder Distribution
   * @throws FetchError<400, types.GetHolderV1DistributionResponse400> Bad Request
   * @throws FetchError<401, types.GetHolderV1DistributionResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetHolderV1DistributionResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetHolderV1DistributionResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetHolderV1DistributionResponse500> Internal Server Error
   */
  getHolderV1Distribution(metadata: types.GetHolderV1DistributionMetadataParam): Promise<FetchResponse<200, types.GetHolderV1DistributionResponse200>> {
    return this.core.fetch('/holder/v1/distribution', 'get', metadata);
  }

  /**
   * Retrieve detailed information about top gainers/losers
   *
   * @summary Trader - Gainers/Losers
   * @throws FetchError<400, types.GetTraderGainersLosersResponse400> Bad Request
   * @throws FetchError<401, types.GetTraderGainersLosersResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetTraderGainersLosersResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetTraderGainersLosersResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetTraderGainersLosersResponse500> Internal Server Error
   */
  getTraderGainersLosers(metadata: types.GetTraderGainersLosersMetadataParam): Promise<FetchResponse<200, types.GetTraderGainersLosersResponse200>> {
    return this.core.fetch('/trader/gainers-losers', 'get', metadata);
  }

  /**
   * Retrieve a list of trades of a trader with time bound option.
   *
   * @summary Trader - Trades Seek By Time
   * @throws FetchError<400, types.GetTraderTxsSeekByTimeResponse400> Bad Request
   * @throws FetchError<401, types.GetTraderTxsSeekByTimeResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetTraderTxsSeekByTimeResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetTraderTxsSeekByTimeResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetTraderTxsSeekByTimeResponse500> Internal Server Error
   */
  getTraderTxsSeek_by_time(metadata: types.GetTraderTxsSeekByTimeMetadataParam): Promise<FetchResponse<200, types.GetTraderTxsSeekByTimeResponse200>> {
    return this.core.fetch('/trader/txs/seek_by_time', 'get', metadata);
  }

  /**
   * Retrieve the portfolio of a wallet.
   *
   * @summary Wallet Portfolio (Beta)
   * @throws FetchError<400, types.GetV1WalletTokenListResponse400> Bad Request
   * @throws FetchError<401, types.GetV1WalletTokenListResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetV1WalletTokenListResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetV1WalletTokenListResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetV1WalletTokenListResponse500> Internal Server Error
   */
  getV1WalletToken_list(metadata: types.GetV1WalletTokenListMetadataParam): Promise<FetchResponse<200, types.GetV1WalletTokenListResponse200>> {
    return this.core.fetch('/v1/wallet/token_list', 'get', metadata);
  }

  /**
   * Retrieve the balance of a token in a wallet.
   *
   * @summary Wallet - Token Balance (Beta)
   * @throws FetchError<400, types.GetV1WalletTokenBalanceResponse400> Bad Request
   * @throws FetchError<401, types.GetV1WalletTokenBalanceResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetV1WalletTokenBalanceResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetV1WalletTokenBalanceResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetV1WalletTokenBalanceResponse500> Internal Server Error
   */
  getV1WalletToken_balance(metadata: types.GetV1WalletTokenBalanceMetadataParam): Promise<FetchResponse<200, types.GetV1WalletTokenBalanceResponse200>> {
    return this.core.fetch('/v1/wallet/token_balance', 'get', metadata);
  }

  /**
   * Retrieve the transaction history of a wallet.
   *
   * @summary Wallet - Transaction History (Beta)
   * @throws FetchError<400, types.GetV1WalletTxListResponse400> Bad Request
   * @throws FetchError<401, types.GetV1WalletTxListResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetV1WalletTxListResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetV1WalletTxListResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetV1WalletTxListResponse500> Internal Server Error
   */
  getV1WalletTx_list(metadata: types.GetV1WalletTxListMetadataParam): Promise<FetchResponse<200, types.GetV1WalletTxListResponse200>> {
    return this.core.fetch('/v1/wallet/tx_list', 'get', metadata);
  }

  /**
   * Retrieve the balance change history of a wallet.
   *
   * @summary Wallet - Balance Change
   * @throws FetchError<400, types.GetWalletV2BalanceChangeResponse400> Bad Request
   * @throws FetchError<401, types.GetWalletV2BalanceChangeResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetWalletV2BalanceChangeResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetWalletV2BalanceChangeResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetWalletV2BalanceChangeResponse500> Internal Server Error
   */
  getWalletV2BalanceChange(metadata: types.GetWalletV2BalanceChangeMetadataParam): Promise<FetchResponse<200, types.GetWalletV2BalanceChangeResponse200>> {
    return this.core.fetch('/wallet/v2/balance-change', 'get', metadata);
  }

  /**
   * Retrieve current net worth and portfolio of a wallet.
   *
   * @summary Wallet - Current Net Worth
   * @throws FetchError<400, types.GetWalletV2CurrentNetWorthResponse400> Bad Request
   * @throws FetchError<401, types.GetWalletV2CurrentNetWorthResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetWalletV2CurrentNetWorthResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetWalletV2CurrentNetWorthResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetWalletV2CurrentNetWorthResponse500> Internal Server Error
   */
  getWalletV2CurrentNetWorth(metadata: types.GetWalletV2CurrentNetWorthMetadataParam): Promise<FetchResponse<200, types.GetWalletV2CurrentNetWorthResponse200>> {
    return this.core.fetch('/wallet/v2/current-net-worth', 'get', metadata);
  }

  /**
   * Retrieve current net worth of multiple wallets. Maximum 100 wallets.
   *
   * @summary Wallet - Current Net Worth Summary (Multiple)
   * @throws FetchError<400, types.PostWalletV2NetWorthSummaryMultipleResponse400> Bad Request
   * @throws FetchError<401, types.PostWalletV2NetWorthSummaryMultipleResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.PostWalletV2NetWorthSummaryMultipleResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.PostWalletV2NetWorthSummaryMultipleResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.PostWalletV2NetWorthSummaryMultipleResponse500> Internal Server Error
   */
  postWalletV2NetWorthSummaryMultiple(body: types.PostWalletV2NetWorthSummaryMultipleBodyParam, metadata?: types.PostWalletV2NetWorthSummaryMultipleMetadataParam): Promise<FetchResponse<200, types.PostWalletV2NetWorthSummaryMultipleResponse200>> {
    return this.core.fetch('/wallet/v2/net-worth-summary/multiple', 'post', body, metadata);
  }

  /**
   * Retrieve historical net worth of a wallet by dates.
   *
   * @summary Wallet - Net Worth Chart
   * @throws FetchError<400, types.GetWalletV2NetWorthResponse400> Bad Request
   * @throws FetchError<401, types.GetWalletV2NetWorthResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetWalletV2NetWorthResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetWalletV2NetWorthResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetWalletV2NetWorthResponse500> Internal Server Error
   */
  getWalletV2NetWorth(metadata: types.GetWalletV2NetWorthMetadataParam): Promise<FetchResponse<200, types.GetWalletV2NetWorthResponse200>> {
    return this.core.fetch('/wallet/v2/net-worth', 'get', metadata);
  }

  /**
   * Retrieve asset details of a wallet on a specific date
   *
   * @summary Wallet - Net Worth Details
   * @throws FetchError<400, types.GetWalletV2NetWorthDetailsResponse400> Bad Request
   * @throws FetchError<401, types.GetWalletV2NetWorthDetailsResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetWalletV2NetWorthDetailsResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetWalletV2NetWorthDetailsResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetWalletV2NetWorthDetailsResponse500> Internal Server Error
   */
  getWalletV2NetWorthDetails(metadata: types.GetWalletV2NetWorthDetailsMetadataParam): Promise<FetchResponse<200, types.GetWalletV2NetWorthDetailsResponse200>> {
    return this.core.fetch('/wallet/v2/net-worth-details', 'get', metadata);
  }

  /**
   * Retrieve PnL of a wallet
   *
   * @summary Wallet - PnL (Per Token)
   * @throws FetchError<400, types.GetWalletV2PnlResponse400> Bad Request
   * @throws FetchError<401, types.GetWalletV2PnlResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetWalletV2PnlResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetWalletV2PnlResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetWalletV2PnlResponse500> Internal Server Error
   */
  getWalletV2Pnl(metadata: types.GetWalletV2PnlMetadataParam): Promise<FetchResponse<200, types.GetWalletV2PnlResponse200>> {
    return this.core.fetch('/wallet/v2/pnl', 'get', metadata);
  }

  /**
   * Retrieve PnL of list wallet
   *
   * @summary Wallet - PnL (Per Wallet)
   * @throws FetchError<400, types.GetWalletV2PnlMultipleResponse400> Bad Request
   * @throws FetchError<401, types.GetWalletV2PnlMultipleResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetWalletV2PnlMultipleResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetWalletV2PnlMultipleResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetWalletV2PnlMultipleResponse500> Internal Server Error
   */
  getWalletV2PnlMultiple(metadata: types.GetWalletV2PnlMultipleMetadataParam): Promise<FetchResponse<200, types.GetWalletV2PnlMultipleResponse200>> {
    return this.core.fetch('/wallet/v2/pnl/multiple', 'get', metadata);
  }

  /**
   * Retrieve PnL of a wallet broken down to each token
   *
   * @summary Wallet - PnL Details
   * @throws FetchError<400, types.PostWalletV2PnlDetailsResponse400> Bad Request
   * @throws FetchError<401, types.PostWalletV2PnlDetailsResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.PostWalletV2PnlDetailsResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.PostWalletV2PnlDetailsResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.PostWalletV2PnlDetailsResponse500> Internal Server Error
   */
  postWalletV2PnlDetails(body: types.PostWalletV2PnlDetailsBodyParam, metadata?: types.PostWalletV2PnlDetailsMetadataParam): Promise<FetchResponse<200, types.PostWalletV2PnlDetailsResponse200>> {
    return this.core.fetch('/wallet/v2/pnl/details', 'post', body, metadata);
  }

  /**
   * Retrieve PnL of a wallet
   *
   * @summary Wallet - PnL
   * @throws FetchError<400, types.GetWalletV2PnlSummaryResponse400> Bad Request
   * @throws FetchError<401, types.GetWalletV2PnlSummaryResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetWalletV2PnlSummaryResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetWalletV2PnlSummaryResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetWalletV2PnlSummaryResponse500> Internal Server Error
   */
  getWalletV2PnlSummary(metadata: types.GetWalletV2PnlSummaryMetadataParam): Promise<FetchResponse<200, types.GetWalletV2PnlSummaryResponse200>> {
    return this.core.fetch('/wallet/v2/pnl/summary', 'get', metadata);
  }

  /**
   * Retrieve the balances of a list of tokens in a wallet.
   *
   * @summary Wallet - Tokens Balance
   * @throws FetchError<400, types.PostWalletV2TokenBalanceResponse400> Bad Request
   * @throws FetchError<401, types.PostWalletV2TokenBalanceResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.PostWalletV2TokenBalanceResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.PostWalletV2TokenBalanceResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.PostWalletV2TokenBalanceResponse500> Internal Server Error
   */
  postWalletV2TokenBalance(body: types.PostWalletV2TokenBalanceBodyParam, metadata?: types.PostWalletV2TokenBalanceMetadataParam): Promise<FetchResponse<200, types.PostWalletV2TokenBalanceResponse200>> {
    return this.core.fetch('/wallet/v2/token-balance', 'post', body, metadata);
  }

  /**
   * Retrieve the first tx fund of the wallet.
   *
   * @summary Wallet - First Tx Funded
   * @throws FetchError<400, types.PostWalletV2TxFirstFundedResponse400> Bad Request
   * @throws FetchError<401, types.PostWalletV2TxFirstFundedResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.PostWalletV2TxFirstFundedResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.PostWalletV2TxFirstFundedResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.PostWalletV2TxFirstFundedResponse500> Internal Server Error
   */
  postWalletV2TxFirstFunded(body: types.PostWalletV2TxFirstFundedBodyParam, metadata?: types.PostWalletV2TxFirstFundedMetadataParam): Promise<FetchResponse<200, types.PostWalletV2TxFirstFundedResponse200>> {
    return this.core.fetch('/wallet/v2/tx/first-funded', 'post', body, metadata);
  }

  /**
   * Retrieve list transfer of the wallet.
   *
   * @summary Wallet - Transfer
   * @throws FetchError<400, types.PostWalletV2TransferResponse400> Bad Request
   * @throws FetchError<401, types.PostWalletV2TransferResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.PostWalletV2TransferResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.PostWalletV2TransferResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.PostWalletV2TransferResponse500> Internal Server Error
   */
  postWalletV2Transfer(body: types.PostWalletV2TransferBodyParam, metadata?: types.PostWalletV2TransferMetadataParam): Promise<FetchResponse<200, types.PostWalletV2TransferResponse200>> {
    return this.core.fetch('/wallet/v2/transfer', 'post', body, metadata);
  }

  /**
   * Retrieve total transfer of the wallet.
   *
   * @summary Wallet - Transfer total
   * @throws FetchError<400, types.PostWalletV2TransferTotalResponse400> Bad Request
   * @throws FetchError<401, types.PostWalletV2TransferTotalResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.PostWalletV2TransferTotalResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.PostWalletV2TransferTotalResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.PostWalletV2TransferTotalResponse500> Internal Server Error
   */
  postWalletV2TransferTotal(body: types.PostWalletV2TransferTotalBodyParam, metadata?: types.PostWalletV2TransferTotalMetadataParam): Promise<FetchResponse<200, types.PostWalletV2TransferTotalResponse200>> {
    return this.core.fetch('/wallet/v2/transfer/total', 'post', body, metadata);
  }

  /**
   * Search for tokens and market data by providing a name, symbol, token address, or market
   * address.
   *
   * @summary Search - Token, market Data
   * @throws FetchError<400, types.GetDefiV3SearchResponse400> Bad Request
   * @throws FetchError<401, types.GetDefiV3SearchResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetDefiV3SearchResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetDefiV3SearchResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetDefiV3SearchResponse500> Internal Server Error
   */
  getDefiV3Search(metadata: types.GetDefiV3SearchMetadataParam): Promise<FetchResponse<200, types.GetDefiV3SearchResponse200>> {
    return this.core.fetch('/defi/v3/search', 'get', metadata);
  }

  /**
   * Retrieve the latest block number of trades on a chain
   *
   * @summary Trades - Latest Block Number
   * @throws FetchError<400, types.GetDefiV3TxsLatestBlockResponse400> Bad Request
   * @throws FetchError<401, types.GetDefiV3TxsLatestBlockResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetDefiV3TxsLatestBlockResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetDefiV3TxsLatestBlockResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetDefiV3TxsLatestBlockResponse500> Internal Server Error
   */
  getDefiV3TxsLatestBlock(metadata?: types.GetDefiV3TxsLatestBlockMetadataParam): Promise<FetchResponse<200, types.GetDefiV3TxsLatestBlockResponse200>> {
    return this.core.fetch('/defi/v3/txs/latest-block', 'get', metadata);
  }

  /**
   * Retrieve credit usage of current account.
   *
   * @summary Utils - Credits Usage of current account
   * @throws FetchError<400, types.GetUtilsV1CreditsResponse400> Bad Request
   * @throws FetchError<401, types.GetUtilsV1CreditsResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetUtilsV1CreditsResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetUtilsV1CreditsResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetUtilsV1CreditsResponse500> Internal Server Error
   */
  getUtilsV1Credits(metadata?: types.GetUtilsV1CreditsMetadataParam): Promise<FetchResponse<200, types.GetUtilsV1CreditsResponse200>> {
    return this.core.fetch('/utils/v1/credits', 'get', metadata);
  }

  /**
   * Retrieve a list of all supported networks.
   *
   * @summary Supported Networks
   * @throws FetchError<400, types.GetDefiNetworksResponse400> Bad Request
   * @throws FetchError<401, types.GetDefiNetworksResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetDefiNetworksResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetDefiNetworksResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetDefiNetworksResponse500> Internal Server Error
   */
  getDefiNetworks(): Promise<FetchResponse<200, types.GetDefiNetworksResponse200>> {
    return this.core.fetch('/defi/networks', 'get');
  }

  /**
   * Retrieve a list of all wallet supported networks.
   *
   * @summary Wallet Supported Networks
   * @throws FetchError<400, types.GetV1WalletListSupportedChainResponse400> Bad Request
   * @throws FetchError<401, types.GetV1WalletListSupportedChainResponse401> Unauthorized. API key is missing or invalid
   * @throws FetchError<403, types.GetV1WalletListSupportedChainResponse403> Forbidden. Request is blacklisted or not whitelisted
   * @throws FetchError<429, types.GetV1WalletListSupportedChainResponse429> Too Many Requests. Rate limit reached
   * @throws FetchError<500, types.GetV1WalletListSupportedChainResponse500> Internal Server Error
   */
  getV1WalletList_supported_chain(): Promise<FetchResponse<200, types.GetV1WalletListSupportedChainResponse200>> {
    return this.core.fetch('/v1/wallet/list_supported_chain', 'get');
  }
}

const createSDK = (() => { return new SDK(); })()
;

export default createSDK;

export type { GetDefiHistoricalPriceUnixMetadataParam, GetDefiHistoricalPriceUnixResponse200, GetDefiHistoricalPriceUnixResponse400, GetDefiHistoricalPriceUnixResponse401, GetDefiHistoricalPriceUnixResponse403, GetDefiHistoricalPriceUnixResponse429, GetDefiHistoricalPriceUnixResponse500, GetDefiHistoryPriceMetadataParam, GetDefiHistoryPriceResponse200, GetDefiHistoryPriceResponse400, GetDefiHistoryPriceResponse401, GetDefiHistoryPriceResponse403, GetDefiHistoryPriceResponse429, GetDefiHistoryPriceResponse500, GetDefiMultiPriceMetadataParam, GetDefiMultiPriceResponse200, GetDefiMultiPriceResponse400, GetDefiMultiPriceResponse401, GetDefiMultiPriceResponse403, GetDefiMultiPriceResponse429, GetDefiMultiPriceResponse500, GetDefiNetworksResponse200, GetDefiNetworksResponse400, GetDefiNetworksResponse401, GetDefiNetworksResponse403, GetDefiNetworksResponse429, GetDefiNetworksResponse500, GetDefiOhlcvBaseQuoteMetadataParam, GetDefiOhlcvBaseQuoteResponse200, GetDefiOhlcvBaseQuoteResponse400, GetDefiOhlcvBaseQuoteResponse401, GetDefiOhlcvBaseQuoteResponse403, GetDefiOhlcvBaseQuoteResponse429, GetDefiOhlcvBaseQuoteResponse500, GetDefiOhlcvMetadataParam, GetDefiOhlcvPairMetadataParam, GetDefiOhlcvPairResponse200, GetDefiOhlcvPairResponse400, GetDefiOhlcvPairResponse401, GetDefiOhlcvPairResponse403, GetDefiOhlcvPairResponse429, GetDefiOhlcvPairResponse500, GetDefiOhlcvResponse200, GetDefiOhlcvResponse400, GetDefiOhlcvResponse401, GetDefiOhlcvResponse403, GetDefiOhlcvResponse429, GetDefiOhlcvResponse500, GetDefiPriceMetadataParam, GetDefiPriceResponse200, GetDefiPriceResponse400, GetDefiPriceResponse401, GetDefiPriceResponse403, GetDefiPriceResponse429, GetDefiPriceResponse500, GetDefiPriceVolumeSingleMetadataParam, GetDefiPriceVolumeSingleResponse200, GetDefiPriceVolumeSingleResponse400, GetDefiPriceVolumeSingleResponse401, GetDefiPriceVolumeSingleResponse403, GetDefiPriceVolumeSingleResponse429, GetDefiPriceVolumeSingleResponse500, GetDefiTokenCreationInfoMetadataParam, GetDefiTokenCreationInfoResponse200, GetDefiTokenCreationInfoResponse400, GetDefiTokenCreationInfoResponse401, GetDefiTokenCreationInfoResponse403, GetDefiTokenCreationInfoResponse429, GetDefiTokenCreationInfoResponse500, GetDefiTokenOverviewMetadataParam, GetDefiTokenOverviewResponse200, GetDefiTokenOverviewResponse400, GetDefiTokenOverviewResponse401, GetDefiTokenOverviewResponse403, GetDefiTokenOverviewResponse429, GetDefiTokenOverviewResponse500, GetDefiTokenSecurityMetadataParam, GetDefiTokenSecurityResponse200, GetDefiTokenSecurityResponse400, GetDefiTokenSecurityResponse401, GetDefiTokenSecurityResponse403, GetDefiTokenSecurityResponse429, GetDefiTokenSecurityResponse500, GetDefiTokenTrendingMetadataParam, GetDefiTokenTrendingResponse200, GetDefiTokenTrendingResponse400, GetDefiTokenTrendingResponse401, GetDefiTokenTrendingResponse403, GetDefiTokenTrendingResponse429, GetDefiTokenTrendingResponse500, GetDefiTokenlistMetadataParam, GetDefiTokenlistResponse200, GetDefiTokenlistResponse400, GetDefiTokenlistResponse401, GetDefiTokenlistResponse403, GetDefiTokenlistResponse429, GetDefiTokenlistResponse500, GetDefiTxsPairMetadataParam, GetDefiTxsPairResponse200, GetDefiTxsPairResponse400, GetDefiTxsPairResponse401, GetDefiTxsPairResponse403, GetDefiTxsPairResponse429, GetDefiTxsPairResponse500, GetDefiTxsPairSeekByTimeMetadataParam, GetDefiTxsPairSeekByTimeResponse200, GetDefiTxsPairSeekByTimeResponse400, GetDefiTxsPairSeekByTimeResponse401, GetDefiTxsPairSeekByTimeResponse403, GetDefiTxsPairSeekByTimeResponse429, GetDefiTxsPairSeekByTimeResponse500, GetDefiTxsTokenMetadataParam, GetDefiTxsTokenResponse200, GetDefiTxsTokenResponse400, GetDefiTxsTokenResponse401, GetDefiTxsTokenResponse403, GetDefiTxsTokenResponse429, GetDefiTxsTokenResponse500, GetDefiTxsTokenSeekByTimeMetadataParam, GetDefiTxsTokenSeekByTimeResponse200, GetDefiTxsTokenSeekByTimeResponse400, GetDefiTxsTokenSeekByTimeResponse401, GetDefiTxsTokenSeekByTimeResponse403, GetDefiTxsTokenSeekByTimeResponse429, GetDefiTxsTokenSeekByTimeResponse500, GetDefiV2MarketsMetadataParam, GetDefiV2MarketsResponse200, GetDefiV2MarketsResponse400, GetDefiV2MarketsResponse401, GetDefiV2MarketsResponse403, GetDefiV2MarketsResponse429, GetDefiV2MarketsResponse500, GetDefiV2TokensNewListingMetadataParam, GetDefiV2TokensNewListingResponse200, GetDefiV2TokensNewListingResponse400, GetDefiV2TokensNewListingResponse401, GetDefiV2TokensNewListingResponse403, GetDefiV2TokensNewListingResponse429, GetDefiV2TokensNewListingResponse500, GetDefiV2TokensTopTradersMetadataParam, GetDefiV2TokensTopTradersResponse200, GetDefiV2TokensTopTradersResponse400, GetDefiV2TokensTopTradersResponse401, GetDefiV2TokensTopTradersResponse403, GetDefiV2TokensTopTradersResponse429, GetDefiV2TokensTopTradersResponse500, GetDefiV3AllTimeTradesSingleMetadataParam, GetDefiV3AllTimeTradesSingleResponse200, GetDefiV3AllTimeTradesSingleResponse400, GetDefiV3AllTimeTradesSingleResponse401, GetDefiV3AllTimeTradesSingleResponse403, GetDefiV3AllTimeTradesSingleResponse429, GetDefiV3AllTimeTradesSingleResponse500, GetDefiV3OhlcvMetadataParam, GetDefiV3OhlcvPairMetadataParam, GetDefiV3OhlcvPairResponse200, GetDefiV3OhlcvPairResponse400, GetDefiV3OhlcvPairResponse401, GetDefiV3OhlcvPairResponse403, GetDefiV3OhlcvPairResponse429, GetDefiV3OhlcvPairResponse500, GetDefiV3OhlcvResponse200, GetDefiV3OhlcvResponse400, GetDefiV3OhlcvResponse401, GetDefiV3OhlcvResponse403, GetDefiV3OhlcvResponse429, GetDefiV3OhlcvResponse500, GetDefiV3PairOverviewMultipleMetadataParam, GetDefiV3PairOverviewMultipleResponse200, GetDefiV3PairOverviewMultipleResponse400, GetDefiV3PairOverviewMultipleResponse401, GetDefiV3PairOverviewMultipleResponse403, GetDefiV3PairOverviewMultipleResponse429, GetDefiV3PairOverviewMultipleResponse500, GetDefiV3PairOverviewSingleMetadataParam, GetDefiV3PairOverviewSingleResponse200, GetDefiV3PairOverviewSingleResponse400, GetDefiV3PairOverviewSingleResponse401, GetDefiV3PairOverviewSingleResponse403, GetDefiV3PairOverviewSingleResponse429, GetDefiV3PairOverviewSingleResponse500, GetDefiV3PriceStatsSingleMetadataParam, GetDefiV3PriceStatsSingleResponse200, GetDefiV3PriceStatsSingleResponse400, GetDefiV3PriceStatsSingleResponse401, GetDefiV3PriceStatsSingleResponse403, GetDefiV3PriceStatsSingleResponse429, GetDefiV3PriceStatsSingleResponse500, GetDefiV3SearchMetadataParam, GetDefiV3SearchResponse200, GetDefiV3SearchResponse400, GetDefiV3SearchResponse401, GetDefiV3SearchResponse403, GetDefiV3SearchResponse429, GetDefiV3SearchResponse500, GetDefiV3TokenExitLiquidityMetadataParam, GetDefiV3TokenExitLiquidityMultipleMetadataParam, GetDefiV3TokenExitLiquidityMultipleResponse200, GetDefiV3TokenExitLiquidityMultipleResponse400, GetDefiV3TokenExitLiquidityMultipleResponse401, GetDefiV3TokenExitLiquidityMultipleResponse403, GetDefiV3TokenExitLiquidityMultipleResponse429, GetDefiV3TokenExitLiquidityMultipleResponse500, GetDefiV3TokenExitLiquidityResponse200, GetDefiV3TokenExitLiquidityResponse400, GetDefiV3TokenExitLiquidityResponse401, GetDefiV3TokenExitLiquidityResponse403, GetDefiV3TokenExitLiquidityResponse429, GetDefiV3TokenExitLiquidityResponse500, GetDefiV3TokenHolderMetadataParam, GetDefiV3TokenHolderResponse200, GetDefiV3TokenHolderResponse400, GetDefiV3TokenHolderResponse401, GetDefiV3TokenHolderResponse403, GetDefiV3TokenHolderResponse429, GetDefiV3TokenHolderResponse500, GetDefiV3TokenListMetadataParam, GetDefiV3TokenListResponse200, GetDefiV3TokenListResponse400, GetDefiV3TokenListResponse401, GetDefiV3TokenListResponse403, GetDefiV3TokenListResponse429, GetDefiV3TokenListResponse500, GetDefiV3TokenListScrollMetadataParam, GetDefiV3TokenListScrollResponse200, GetDefiV3TokenListScrollResponse400, GetDefiV3TokenListScrollResponse401, GetDefiV3TokenListScrollResponse403, GetDefiV3TokenListScrollResponse429, GetDefiV3TokenListScrollResponse500, GetDefiV3TokenMarketDataMetadataParam, GetDefiV3TokenMarketDataMultipleMetadataParam, GetDefiV3TokenMarketDataMultipleResponse200, GetDefiV3TokenMarketDataMultipleResponse400, GetDefiV3TokenMarketDataMultipleResponse401, GetDefiV3TokenMarketDataMultipleResponse403, GetDefiV3TokenMarketDataMultipleResponse429, GetDefiV3TokenMarketDataMultipleResponse500, GetDefiV3TokenMarketDataResponse200, GetDefiV3TokenMarketDataResponse400, GetDefiV3TokenMarketDataResponse401, GetDefiV3TokenMarketDataResponse403, GetDefiV3TokenMarketDataResponse429, GetDefiV3TokenMarketDataResponse500, GetDefiV3TokenMemeDetailSingleMetadataParam, GetDefiV3TokenMemeDetailSingleResponse200, GetDefiV3TokenMemeDetailSingleResponse400, GetDefiV3TokenMemeDetailSingleResponse401, GetDefiV3TokenMemeDetailSingleResponse403, GetDefiV3TokenMemeDetailSingleResponse429, GetDefiV3TokenMemeDetailSingleResponse500, GetDefiV3TokenMemeListMetadataParam, GetDefiV3TokenMemeListResponse200, GetDefiV3TokenMemeListResponse400, GetDefiV3TokenMemeListResponse401, GetDefiV3TokenMemeListResponse403, GetDefiV3TokenMemeListResponse429, GetDefiV3TokenMemeListResponse500, GetDefiV3TokenMetaDataMultipleMetadataParam, GetDefiV3TokenMetaDataMultipleResponse200, GetDefiV3TokenMetaDataMultipleResponse400, GetDefiV3TokenMetaDataMultipleResponse401, GetDefiV3TokenMetaDataMultipleResponse403, GetDefiV3TokenMetaDataMultipleResponse429, GetDefiV3TokenMetaDataMultipleResponse500, GetDefiV3TokenMetaDataSingleMetadataParam, GetDefiV3TokenMetaDataSingleResponse200, GetDefiV3TokenMetaDataSingleResponse400, GetDefiV3TokenMetaDataSingleResponse401, GetDefiV3TokenMetaDataSingleResponse403, GetDefiV3TokenMetaDataSingleResponse429, GetDefiV3TokenMetaDataSingleResponse500, GetDefiV3TokenMintBurnTxsMetadataParam, GetDefiV3TokenMintBurnTxsResponse200, GetDefiV3TokenMintBurnTxsResponse400, GetDefiV3TokenMintBurnTxsResponse401, GetDefiV3TokenMintBurnTxsResponse403, GetDefiV3TokenMintBurnTxsResponse429, GetDefiV3TokenMintBurnTxsResponse500, GetDefiV3TokenTradeDataMultipleMetadataParam, GetDefiV3TokenTradeDataMultipleResponse200, GetDefiV3TokenTradeDataMultipleResponse400, GetDefiV3TokenTradeDataMultipleResponse401, GetDefiV3TokenTradeDataMultipleResponse403, GetDefiV3TokenTradeDataMultipleResponse429, GetDefiV3TokenTradeDataMultipleResponse500, GetDefiV3TokenTradeDataSingleMetadataParam, GetDefiV3TokenTradeDataSingleResponse200, GetDefiV3TokenTradeDataSingleResponse400, GetDefiV3TokenTradeDataSingleResponse401, GetDefiV3TokenTradeDataSingleResponse403, GetDefiV3TokenTradeDataSingleResponse429, GetDefiV3TokenTradeDataSingleResponse500, GetDefiV3TokenTxsByVolumeMetadataParam, GetDefiV3TokenTxsByVolumeResponse200, GetDefiV3TokenTxsByVolumeResponse400, GetDefiV3TokenTxsByVolumeResponse401, GetDefiV3TokenTxsByVolumeResponse403, GetDefiV3TokenTxsByVolumeResponse429, GetDefiV3TokenTxsByVolumeResponse500, GetDefiV3TokenTxsMetadataParam, GetDefiV3TokenTxsResponse200, GetDefiV3TokenTxsResponse400, GetDefiV3TokenTxsResponse401, GetDefiV3TokenTxsResponse403, GetDefiV3TokenTxsResponse429, GetDefiV3TokenTxsResponse500, GetDefiV3TxsLatestBlockMetadataParam, GetDefiV3TxsLatestBlockResponse200, GetDefiV3TxsLatestBlockResponse400, GetDefiV3TxsLatestBlockResponse401, GetDefiV3TxsLatestBlockResponse403, GetDefiV3TxsLatestBlockResponse429, GetDefiV3TxsLatestBlockResponse500, GetDefiV3TxsMetadataParam, GetDefiV3TxsRecentMetadataParam, GetDefiV3TxsRecentResponse200, GetDefiV3TxsRecentResponse400, GetDefiV3TxsRecentResponse401, GetDefiV3TxsRecentResponse403, GetDefiV3TxsRecentResponse429, GetDefiV3TxsRecentResponse500, GetDefiV3TxsResponse200, GetDefiV3TxsResponse400, GetDefiV3TxsResponse401, GetDefiV3TxsResponse403, GetDefiV3TxsResponse429, GetDefiV3TxsResponse500, GetHolderV1DistributionMetadataParam, GetHolderV1DistributionResponse200, GetHolderV1DistributionResponse400, GetHolderV1DistributionResponse401, GetHolderV1DistributionResponse403, GetHolderV1DistributionResponse429, GetHolderV1DistributionResponse500, GetTraderGainersLosersMetadataParam, GetTraderGainersLosersResponse200, GetTraderGainersLosersResponse400, GetTraderGainersLosersResponse401, GetTraderGainersLosersResponse403, GetTraderGainersLosersResponse429, GetTraderGainersLosersResponse500, GetTraderTxsSeekByTimeMetadataParam, GetTraderTxsSeekByTimeResponse200, GetTraderTxsSeekByTimeResponse400, GetTraderTxsSeekByTimeResponse401, GetTraderTxsSeekByTimeResponse403, GetTraderTxsSeekByTimeResponse429, GetTraderTxsSeekByTimeResponse500, GetUtilsV1CreditsMetadataParam, GetUtilsV1CreditsResponse200, GetUtilsV1CreditsResponse400, GetUtilsV1CreditsResponse401, GetUtilsV1CreditsResponse403, GetUtilsV1CreditsResponse429, GetUtilsV1CreditsResponse500, GetV1WalletListSupportedChainResponse200, GetV1WalletListSupportedChainResponse400, GetV1WalletListSupportedChainResponse401, GetV1WalletListSupportedChainResponse403, GetV1WalletListSupportedChainResponse429, GetV1WalletListSupportedChainResponse500, GetV1WalletTokenBalanceMetadataParam, GetV1WalletTokenBalanceResponse200, GetV1WalletTokenBalanceResponse400, GetV1WalletTokenBalanceResponse401, GetV1WalletTokenBalanceResponse403, GetV1WalletTokenBalanceResponse429, GetV1WalletTokenBalanceResponse500, GetV1WalletTokenListMetadataParam, GetV1WalletTokenListResponse200, GetV1WalletTokenListResponse400, GetV1WalletTokenListResponse401, GetV1WalletTokenListResponse403, GetV1WalletTokenListResponse429, GetV1WalletTokenListResponse500, GetV1WalletTxListMetadataParam, GetV1WalletTxListResponse200, GetV1WalletTxListResponse400, GetV1WalletTxListResponse401, GetV1WalletTxListResponse403, GetV1WalletTxListResponse429, GetV1WalletTxListResponse500, GetWalletV2BalanceChangeMetadataParam, GetWalletV2BalanceChangeResponse200, GetWalletV2BalanceChangeResponse400, GetWalletV2BalanceChangeResponse401, GetWalletV2BalanceChangeResponse403, GetWalletV2BalanceChangeResponse429, GetWalletV2BalanceChangeResponse500, GetWalletV2CurrentNetWorthMetadataParam, GetWalletV2CurrentNetWorthResponse200, GetWalletV2CurrentNetWorthResponse400, GetWalletV2CurrentNetWorthResponse401, GetWalletV2CurrentNetWorthResponse403, GetWalletV2CurrentNetWorthResponse429, GetWalletV2CurrentNetWorthResponse500, GetWalletV2NetWorthDetailsMetadataParam, GetWalletV2NetWorthDetailsResponse200, GetWalletV2NetWorthDetailsResponse400, GetWalletV2NetWorthDetailsResponse401, GetWalletV2NetWorthDetailsResponse403, GetWalletV2NetWorthDetailsResponse429, GetWalletV2NetWorthDetailsResponse500, GetWalletV2NetWorthMetadataParam, GetWalletV2NetWorthResponse200, GetWalletV2NetWorthResponse400, GetWalletV2NetWorthResponse401, GetWalletV2NetWorthResponse403, GetWalletV2NetWorthResponse429, GetWalletV2NetWorthResponse500, GetWalletV2PnlMetadataParam, GetWalletV2PnlMultipleMetadataParam, GetWalletV2PnlMultipleResponse200, GetWalletV2PnlMultipleResponse400, GetWalletV2PnlMultipleResponse401, GetWalletV2PnlMultipleResponse403, GetWalletV2PnlMultipleResponse429, GetWalletV2PnlMultipleResponse500, GetWalletV2PnlResponse200, GetWalletV2PnlResponse400, GetWalletV2PnlResponse401, GetWalletV2PnlResponse403, GetWalletV2PnlResponse429, GetWalletV2PnlResponse500, GetWalletV2PnlSummaryMetadataParam, GetWalletV2PnlSummaryResponse200, GetWalletV2PnlSummaryResponse400, GetWalletV2PnlSummaryResponse401, GetWalletV2PnlSummaryResponse403, GetWalletV2PnlSummaryResponse429, GetWalletV2PnlSummaryResponse500, PostDefiMultiPriceBodyParam, PostDefiMultiPriceMetadataParam, PostDefiMultiPriceResponse200, PostDefiMultiPriceResponse400, PostDefiMultiPriceResponse401, PostDefiMultiPriceResponse403, PostDefiMultiPriceResponse429, PostDefiMultiPriceResponse500, PostDefiPriceVolumeMultiBodyParam, PostDefiPriceVolumeMultiMetadataParam, PostDefiPriceVolumeMultiResponse200, PostDefiPriceVolumeMultiResponse400, PostDefiPriceVolumeMultiResponse401, PostDefiPriceVolumeMultiResponse403, PostDefiPriceVolumeMultiResponse429, PostDefiPriceVolumeMultiResponse500, PostDefiV3AllTimeTradesMultipleMetadataParam, PostDefiV3AllTimeTradesMultipleResponse200, PostDefiV3AllTimeTradesMultipleResponse400, PostDefiV3AllTimeTradesMultipleResponse401, PostDefiV3AllTimeTradesMultipleResponse403, PostDefiV3AllTimeTradesMultipleResponse429, PostDefiV3AllTimeTradesMultipleResponse500, PostDefiV3PriceStatsMultipleBodyParam, PostDefiV3PriceStatsMultipleMetadataParam, PostDefiV3PriceStatsMultipleResponse200, PostDefiV3PriceStatsMultipleResponse400, PostDefiV3PriceStatsMultipleResponse401, PostDefiV3PriceStatsMultipleResponse403, PostDefiV3PriceStatsMultipleResponse429, PostDefiV3PriceStatsMultipleResponse500, PostTokenV1HolderBatchBodyParam, PostTokenV1HolderBatchMetadataParam, PostTokenV1HolderBatchResponse200, PostTokenV1HolderBatchResponse400, PostTokenV1HolderBatchResponse401, PostTokenV1HolderBatchResponse403, PostTokenV1HolderBatchResponse429, PostTokenV1HolderBatchResponse500, PostTokenV1TransferBodyParam, PostTokenV1TransferMetadataParam, PostTokenV1TransferResponse200, PostTokenV1TransferResponse400, PostTokenV1TransferResponse401, PostTokenV1TransferResponse403, PostTokenV1TransferResponse429, PostTokenV1TransferResponse500, PostTokenV1TransferTotalBodyParam, PostTokenV1TransferTotalMetadataParam, PostTokenV1TransferTotalResponse200, PostTokenV1TransferTotalResponse400, PostTokenV1TransferTotalResponse401, PostTokenV1TransferTotalResponse403, PostTokenV1TransferTotalResponse429, PostTokenV1TransferTotalResponse500, PostWalletV2NetWorthSummaryMultipleBodyParam, PostWalletV2NetWorthSummaryMultipleMetadataParam, PostWalletV2NetWorthSummaryMultipleResponse200, PostWalletV2NetWorthSummaryMultipleResponse400, PostWalletV2NetWorthSummaryMultipleResponse401, PostWalletV2NetWorthSummaryMultipleResponse403, PostWalletV2NetWorthSummaryMultipleResponse429, PostWalletV2NetWorthSummaryMultipleResponse500, PostWalletV2PnlDetailsBodyParam, PostWalletV2PnlDetailsMetadataParam, PostWalletV2PnlDetailsResponse200, PostWalletV2PnlDetailsResponse400, PostWalletV2PnlDetailsResponse401, PostWalletV2PnlDetailsResponse403, PostWalletV2PnlDetailsResponse429, PostWalletV2PnlDetailsResponse500, PostWalletV2TokenBalanceBodyParam, PostWalletV2TokenBalanceMetadataParam, PostWalletV2TokenBalanceResponse200, PostWalletV2TokenBalanceResponse400, PostWalletV2TokenBalanceResponse401, PostWalletV2TokenBalanceResponse403, PostWalletV2TokenBalanceResponse429, PostWalletV2TokenBalanceResponse500, PostWalletV2TransferBodyParam, PostWalletV2TransferMetadataParam, PostWalletV2TransferResponse200, PostWalletV2TransferResponse400, PostWalletV2TransferResponse401, PostWalletV2TransferResponse403, PostWalletV2TransferResponse429, PostWalletV2TransferResponse500, PostWalletV2TransferTotalBodyParam, PostWalletV2TransferTotalMetadataParam, PostWalletV2TransferTotalResponse200, PostWalletV2TransferTotalResponse400, PostWalletV2TransferTotalResponse401, PostWalletV2TransferTotalResponse403, PostWalletV2TransferTotalResponse429, PostWalletV2TransferTotalResponse500, PostWalletV2TxFirstFundedBodyParam, PostWalletV2TxFirstFundedMetadataParam, PostWalletV2TxFirstFundedResponse200, PostWalletV2TxFirstFundedResponse400, PostWalletV2TxFirstFundedResponse401, PostWalletV2TxFirstFundedResponse403, PostWalletV2TxFirstFundedResponse429, PostWalletV2TxFirstFundedResponse500 } from './types';
