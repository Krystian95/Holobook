//! The JsonString type is defined here. It is used throughout Holochain
//! to enforce a standardized serialization of data to/from json.

use crate::error::{JsonError, JsonResult};
use serde::{de::DeserializeOwned, Serialize};
use serde_json;
use std::{
    convert::{TryFrom, TryInto},
    fmt::{Debug, Display, Formatter, Result as FmtResult},
};

/// track json serialization with the rust type system!
/// JsonString wraps a string containing JSON serialized data
/// avoid accidental double-serialization or forgetting to serialize
/// serialize any type consistently including hard-to-reach places like Option<Entry> and Result
/// JsonString must not itself be serialized/deserialized
/// instead, implement and use the native `From` trait to move between types
/// - moving to/from String, str, JsonString and JsonString simply (un)wraps it as raw JSON data
/// - moving to/from any other type must offer a reliable serialization/deserialization strategy
#[derive(Debug, PartialEq, Clone, Hash, Eq, Serialize, Deserialize)]
pub struct JsonString(String);

impl JsonString {
    /// a null JSON value
    /// e.g. represents None when implementing From<Option<Foo>>
    pub fn null() -> JsonString {
        JsonString::from_json("null")
    }

    pub fn empty_object() -> JsonString {
        JsonString::from_json("{}")
    }

    pub fn is_null(&self) -> bool {
        self == &Self::null()
    }

    // Creates a JsonString from stringified json
    // replaces From<String> for JsonString and requires conversions to be explicit
    // This is because string types must be handled differently depending on if
    // they are strinfigied JSON or JSON strings
    pub fn from_json(s: &str) -> JsonString {
        let cleaned = s
            // remove whitespace from both ends
            .trim()
            // remove null characters from both ends
            .trim_matches(char::from(0));
        JsonString(cleaned.to_owned())
    }

    /// achieves the same outcome as serde_json::to_vec()
    pub fn to_bytes(&self) -> Vec<u8> {
        self.0.clone().into_bytes()
    }

    pub fn from_bytes(bytes: Vec<u8>) -> Self {
        Self::from_json(&String::from_utf8_lossy(&bytes))
    }
}

impl From<bool> for JsonString {
    fn from(u: bool) -> JsonString {
        default_to_json(u)
    }
}

impl From<u32> for JsonString {
    fn from(u: u32) -> JsonString {
        default_to_json(u)
    }
}

impl From<i32> for JsonString {
    fn from(u: i32) -> JsonString {
        default_to_json(u)
    }
}

impl From<u64> for JsonString {
    fn from(u: u64) -> JsonString {
        default_to_json(u)
    }
}

impl From<u128> for JsonString {
    fn from(u: u128) -> JsonString {
        default_to_json(u)
    }
}

impl TryFrom<JsonString> for bool {
    type Error = JsonError;
    fn try_from(j: JsonString) -> Result<Self, Self::Error> {
        default_try_from_json(j)
    }
}

impl TryFrom<JsonString> for u32 {
    type Error = JsonError;
    fn try_from(j: JsonString) -> Result<Self, Self::Error> {
        default_try_from_json(j)
    }
}

impl TryFrom<JsonString> for u64 {
    type Error = JsonError;
    fn try_from(j: JsonString) -> Result<Self, Self::Error> {
        default_try_from_json(j)
    }
}

impl From<serde_json::Value> for JsonString {
    fn from(v: serde_json::Value) -> JsonString {
        JsonString::from_json(&v.to_string())
    }
}

impl From<JsonString> for String {
    fn from(json_string: JsonString) -> String {
        json_string.0
    }
}

impl<'a> From<&'a JsonString> for &'a str {
    fn from(json_string: &'a JsonString) -> &'a str {
        &json_string.0
    }
}

impl<'a> From<&'a JsonString> for String {
    fn from(json_string: &JsonString) -> String {
        String::from(json_string.to_owned())
    }
}

impl From<&'static str> for JsonString {
    fn from(s: &str) -> JsonString {
        JsonString::from_json(&String::from(s))
    }
}

impl<T: Serialize> From<Vec<T>> for JsonString {
    fn from(vector: Vec<T>) -> JsonString {
        JsonString::from_json(&serde_json::to_string(&vector).expect("could not Jsonify vector"))
    }
}

// conversions from result types

fn result_to_json_string<T: Into<JsonString>, E: Into<JsonString>>(
    result: Result<T, E>,
) -> JsonString {
    let is_ok = result.is_ok();
    let inner_json: JsonString = match result {
        Ok(inner) => inner.into(),
        Err(inner) => inner.into(),
    };
    let inner_string = String::from(inner_json);
    JsonString::from_json(&format!(
        "{{\"{}\":{}}}",
        if is_ok { "Ok" } else { "Err" },
        inner_string
    ))
}

impl<T, E> From<Result<T, E>> for JsonString
where
    T: Into<JsonString>,
    E: Into<JsonString>,
{
    fn from(result: Result<T, E>) -> JsonString {
        result_to_json_string(result)
    }
}

impl<T> From<Result<T, String>> for JsonString
where
    T: Into<JsonString>,
{
    fn from(result: Result<T, String>) -> JsonString {
        result_to_json_string(result.map_err(|e| RawString::from(e)))
    }
}

impl<E> From<Result<String, E>> for JsonString
where
    E: Into<JsonString>,
{
    fn from(result: Result<String, E>) -> JsonString {
        result_to_json_string(result.map(|v| RawString::from(v)))
    }
}

impl From<Result<String, String>> for JsonString {
    fn from(result: Result<String, String>) -> JsonString {
        result_to_json_string(
            result
                .map(|v| RawString::from(v))
                .map_err(|e| RawString::from(e)),
        )
    }
}

// conversions to result types

impl<T, E> TryInto<Result<T, E>> for JsonString
where
    T: Into<JsonString> + DeserializeOwned,
    E: Into<JsonString> + DeserializeOwned,
{
    type Error = JsonError;
    fn try_into(self) -> Result<Result<T, E>, Self::Error> {
        default_try_from_json(self)
    }
}

impl<T> TryInto<Result<T, String>> for JsonString
where
    T: Into<JsonString> + DeserializeOwned,
{
    type Error = JsonError;
    fn try_into(self) -> Result<Result<T, String>, Self::Error> {
        default_try_from_json(self)
    }
}

impl<E> TryInto<Result<String, E>> for JsonString
where
    E: Into<JsonString> + DeserializeOwned,
{
    type Error = JsonError;
    fn try_into(self) -> Result<Result<String, E>, Self::Error> {
        default_try_from_json(self)
    }
}

impl TryInto<Result<String, String>> for JsonString {
    type Error = JsonError;
    fn try_into(self) -> Result<Result<String, String>, Self::Error> {
        default_try_from_json(self)
    }
}

impl From<()> for JsonString {
    fn from(_: ()) -> Self {
        default_to_json(())
    }
}

impl TryFrom<JsonString> for () {
    type Error = JsonError;
    fn try_from(j: JsonString) -> Result<Self, Self::Error> {
        default_try_from_json(j)
    }
}

impl Display for JsonString {
    fn fmt(&self, f: &mut Formatter) -> FmtResult {
        write!(f, "{}", String::from(self),)
    }
}

// ## Conversions from Option types ##

// Options are a special case for several reasons. Firstly they are handled
// in a special way by serde:

//     "Users tend to have different expectations around the Option enum compared to other enums.
//     Serde JSON will serialize Option::None as null and Option::Some as just the contained value."

// The other issue is that option implements generic From<T> so you can do calls like
// `let s: Option<&str> = "hi".into()`
// To get around this we need to go through an intermediate type JsonStringOption

#[derive(Shrinkwrap, Deserialize)]
pub struct JsonStringOption<T>(Option<T>);

impl<T> JsonStringOption<T> {
    pub fn to_option(self) -> Option<T> {
        self.0
    }
}

impl<T> Into<Option<T>> for JsonStringOption<T> {
    fn into(self) -> Option<T> {
        self.to_option()
    }
}

impl<T> TryInto<JsonStringOption<T>> for JsonString
where
    T: Into<JsonString> + DeserializeOwned,
{
    type Error = JsonError;
    fn try_into(self) -> Result<JsonStringOption<T>, Self::Error> {
        let o: Option<T> = default_try_from_json(self)?;
        Ok(JsonStringOption(o))
    }
}

impl TryInto<JsonStringOption<String>> for JsonString {
    type Error = JsonError;
    fn try_into(self) -> Result<JsonStringOption<String>, Self::Error> {
        let o: Option<String> = default_try_from_json(self)?;
        Ok(JsonStringOption(o))
    }
}

// conversions from options to JsonString

impl<T> From<Option<T>> for JsonString
where
    T: Debug + Serialize + Into<JsonString>,
{
    fn from(o: Option<T>) -> JsonString {
        default_to_json(o)
    }
}

impl From<Option<String>> for JsonString {
    fn from(o: Option<String>) -> JsonString {
        default_to_json(o)
    }
}

/// if all you want to do is implement the default behaviour then use #[derive(DefaultJson)]
/// should only be used with From<S> for JsonString
/// i.e. when failure should be impossible so an expect is ok
/// this is always true for serializable structs/enums
/// standard boilerplate:
/// impl From<MyStruct> for JsonString {
///     fn from(v: MyStruct) -> Self {
///         default_to_json(v)
///     }
/// }
pub fn default_to_json<V: Serialize + Debug>(v: V) -> JsonString {
    serde_json::to_string(&v)
        .map(|s| JsonString::from_json(&s))
        .map_err(|e| JsonError::SerializationError(e.to_string()))
        .unwrap_or_else(|_| panic!("could not Jsonify: {:?}", v))
}

/// if all you want to do is implement the default behaviour then use #[derive(DefaultJson)]
/// standard boilerplate should include JsonError as the Error:
/// impl TryFrom<JsonString> for T {
///     type Error = JsonError;
///     fn try_from(j: JsonString) -> JsonResult<Self> {
///         default_try_from_json(j)
///     }
/// }
pub fn default_try_from_json<D: DeserializeOwned>(json_string: JsonString) -> Result<D, JsonError> {
    serde_json::from_str(&String::from(&json_string))
        .map_err(|e| JsonError::SerializationError(e.to_string()))
}

pub trait DefaultJson:
    Serialize + DeserializeOwned + TryFrom<JsonString> + Into<JsonString>
{
}

/// generic type to facilitate Jsonifying values directly
/// JsonString simply wraps String and str as-is but will Jsonify RawString("foo") as "\"foo\""
/// RawString must not implement Serialize because it should always convert to JsonString with from
/// RawString can implement Deserialize because JsonString uses default serde to step down
#[derive(PartialEq, Debug, Clone, Deserialize)]
pub struct RawString(serde_json::Value);

impl From<&'static str> for RawString {
    fn from(s: &str) -> RawString {
        RawString(serde_json::Value::String(s.to_owned()))
    }
}

impl From<String> for RawString {
    fn from(s: String) -> RawString {
        RawString(serde_json::Value::String(s))
    }
}

impl From<f64> for RawString {
    fn from(i: f64) -> RawString {
        RawString(serde_json::Value::Number(
            serde_json::Number::from_f64(i).expect("could not accept number"),
        ))
    }
}

impl From<i32> for RawString {
    fn from(i: i32) -> RawString {
        RawString::from(f64::from(i))
    }
}

impl From<RawString> for String {
    fn from(raw_string: RawString) -> String {
        // this will panic if RawString does not contain a string!
        // use JsonString::from(...) to stringify numbers or other values
        // @see raw_from_number_test()
        String::from(raw_string.0.as_str().unwrap_or_else(|| {
            panic!(
                "could not extract inner string for RawString: {:?}",
                &raw_string
            )
        }))
    }
}

/// it should always be possible to Jsonify RawString, if not something is very wrong
impl From<RawString> for JsonString {
    fn from(raw_string: RawString) -> JsonString {
        JsonString::from_json(
            &serde_json::to_string(&raw_string.0)
                .unwrap_or_else(|_| panic!("could not Jsonify RawString: {:?}", &raw_string)),
        )
    }
}

/// converting a JsonString to RawString can fail if the JsonString is not a serialized string
impl TryFrom<JsonString> for RawString {
    type Error = JsonError;
    fn try_from(j: JsonString) -> JsonResult<Self> {
        default_try_from_json(j)
    }
}

#[cfg(test)]
pub mod tests {
    use crate::{
        error::JsonError,
        json::{JsonString, JsonStringOption, RawString},
    };
    use serde_json;
    use std::convert::{TryFrom, TryInto};

    #[derive(Serialize, Deserialize, Debug, DefaultJson, PartialEq, Clone)]
    struct DeriveTest {
        foo: String,
    }

    #[test]
    fn default_json_round_trip_test() {
        let test = DeriveTest { foo: "bar".into() };
        let expected = JsonString::from_json("{\"foo\":\"bar\"}");
        assert_eq!(expected, JsonString::from(test.clone()),);

        assert_eq!(&DeriveTest::try_from(expected).unwrap(), &test,);

        assert_eq!(
            test.clone(),
            DeriveTest::try_from(JsonString::from(test)).unwrap(),
        );
    }

    #[test]
    fn json_none_test() {
        assert_eq!(String::from("null"), String::from(JsonString::null()),);
    }

    #[test]
    fn json_bytes_test() {
        let bytes_vec: Vec<u8> = vec![34, 102, 111, 111, 34];

        // note that the byte array has the quote character '/"' at the beginnging and end so it is actually valid json
        assert_eq!(
            JsonString::from(RawString::from("foo")).to_bytes(),
            bytes_vec,
        );

        assert_eq!(
            JsonString::from_bytes(bytes_vec),
            JsonString::from(RawString::from("foo")),
        );
    }

    #[test]
    fn json_result_round_trip_test() {
        let result: Result<String, JsonError> = Err(JsonError::ErrorGeneric("foo".into()));

        assert_eq!(
            JsonString::from(result),
            JsonString::from_json("{\"Err\":{\"ErrorGeneric\":\"foo\"}}"),
        );

        let result: Result<String, String> = Err(String::from("foo"));

        assert_eq!(
            JsonString::from(result),
            JsonString::from_json("{\"Err\":\"foo\"}"),
        )
    }

    #[test]
    /// show From<&str> and From<String> for JsonString
    fn json_from_string_test() {
        assert_eq!(
            String::from("\"foo\""),
            String::from(JsonString::from(RawString::from("foo"))),
        );

        assert_eq!(
            String::from("\"foo\""),
            String::from(JsonString::from_json(&String::from("\"foo\""))),
        );

        assert_eq!(
            String::from("\"foo\""),
            String::from(&JsonString::from(RawString::from("foo"))),
        );
    }

    #[test]
    /// show From<serde_json::Value> for JsonString
    fn json_from_serde_test() {
        assert_eq!(
            String::from("\"foo\""),
            String::from(JsonString::from(serde_json::Value::from("foo"))),
        );
    }

    #[test]
    /// show From<Vec<T>> for JsonString
    fn json_from_vec() {
        assert_eq!(
            String::from("[\"foo\",\"bar\"]"),
            String::from(JsonString::from(vec!["foo", "bar"])),
        );
    }

    #[test]
    /// show From<&str> and From<String> for RawString
    fn raw_from_string_test() {
        assert_eq!(RawString::from(String::from("foo")), RawString::from("foo"),);
    }

    #[test]
    /// show From<RawString> for String
    fn string_from_raw_test() {
        assert_eq!(String::from("foo"), String::from(RawString::from("foo")),);
    }

    #[test]
    /// show From<RawString> for JsonString
    fn json_from_raw_test() {
        assert_eq!(
            String::from("\"foo\""),
            String::from(JsonString::from(RawString::from("foo"))),
        );
    }

    #[test]
    /// show From<JsonString> for RawString
    fn raw_from_json_test() {
        assert_eq!(
            String::from(RawString::try_from(JsonString::from("\"foo\"")).unwrap()),
            String::from("foo"),
        );
    }

    #[test]
    /// show From<number> for RawString
    fn raw_from_number_test() {
        assert_eq!(
            String::from("1.0"),
            String::from(JsonString::from(RawString::from(1))),
        );
    }

    #[test]
    fn result_from_json_string() {
        let j = JsonString::from_json(r#"{"Ok":"raw-string-content"}"#);
        let r: Result<RawString, JsonError> = j
            .try_into()
            .expect("Could not convert json string to result type");

        assert_eq!(r.unwrap(), RawString::from("raw-string-content"),);
    }

    #[test]
    fn result_from_json_string_with_strings() {
        let j = JsonString::from_json(r#"{"Ok":"string-content"}"#);
        let r: Result<String, String> = j
            .try_into()
            .expect("Could not convert json string to result type");

        assert_eq!(r.unwrap(), String::from("string-content"),);
    }

    #[test]
    fn options_are_converted_to_null_or_value_respectively() {
        let o: Option<u32> = None;
        let j: JsonString = o.into();
        assert_eq!(j, JsonString::from_json("null"));

        let o: Option<u32> = Some(10);
        let j: JsonString = o.into();
        assert_eq!(j, JsonString::from_json("10"));

        let o: Option<String> = Some("test".to_string());
        let j: JsonString = o.into();
        assert_eq!(j, JsonString::from_json("\"test\""));
    }

    #[test]
    fn json_string_to_option() {
        let j = JsonString::from("10");
        let o: JsonStringOption<u32> = j.try_into().expect("failed conversion from JsonString");
        assert_eq!(o.to_option(), Some(10));

        let j = JsonString::from("null");
        let o: JsonStringOption<u32> = j.try_into().expect("failed conversion from JsonString");
        assert_eq!(o.to_option(), None);

        // tricky!
        let j = JsonString::from("\"null\"");
        let o: JsonStringOption<String> = j.try_into().expect("failed conversion from JsonString");
        assert_eq!(o.to_option(), Some("null".to_string()));
    }
}
