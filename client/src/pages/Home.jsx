import React from "react";
import { useDispatch, useSelector } from "react-redux";
import ShortenForm from "../components/url/ShortenForm";
import ShortResult from "../components/url/ShortResult";
import {
  shortenStart,
  shortenSuccess,
  shortenFailure,
} from "../store/urlSlice";
import { shortenUrl } from "../services/urlService";
import Loader from "../components/common/Loader";
import ErrorBanner from "../components/common/ErrorBanner";
import { resetUrl } from "../store/urlSlice";

const Home = () => {
  const dispatch = useDispatch();
  const { shortUrl, loading, error } = useSelector((state) => state.url);

  const handleShorten = async (long, ttl) => {
    console.log("HANDLE SHORTEN CALLED:", long, ttl); // 👈 ADD
    dispatch(shortenStart());
    try {
      const res = await shortenUrl(long, ttl);
      dispatch(shortenSuccess(res.data.short));
    } catch (err) {
      dispatch(shortenFailure(err.message || "Something went wrong"));
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: "700px" }}>
      <h1 className="mb-2">URL Shortener</h1>
      <p className="text-muted mb-4">
        Fast redirects powered by Redis caching
      </p>

      <ShortenForm onSubmit={handleShorten} loading={loading} />

      {loading && <Loader text="Shortening URL..." />}

      <ErrorBanner
        message={error}
        onClose={() => dispatch(resetUrl())}
      />

      <ShortResult shortUrl={shortUrl} />
    </div>
  );
};

export default Home;
