import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { short } from '../../state/shortSlice'

const Home = () => {

    const [url, setUrl] = useState("")
    const [shortUrl, setShortUrl] = useState("")
    const [all, setAll] = useState(null)
    const dispatch = useDispatch()

    const changeUrl = (e) => {
        setUrl(e.target.value)
    }

    const getAll = async () => {
        try {
            const res = await fetch(`http://localhost:3001/`);
            const body = await res.json();
            console.log(body.data);
            setAll(body.data)
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        getAll();
    }, [all]);

    const handleShort = async (e) => {
        e.preventDefault()
        try {
            const res = await fetch('http://localhost:3001/', {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': 'http://localhost:3000/'
                },
                method: 'POST',
                body: JSON.stringify({ long: url })
            })
            const data = await res.json()
            console.log(data)
            dispatch(short(data))
            if (data.error) {
                throw data.error
            }
            setUrl("")
            setShortUrl(data.short)
        } catch (error) {
            console.log(error)
        }
    }

    const removeOne = async (e) => {
        try {
            const res = await fetch('http://localhost:3001/remove', {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': 'http://localhost:3000/'
                },
                method: 'POST',
                body: JSON.stringify({ long: e.long })
            })
            const data = await res.json()
            console.log(data)
            dispatch(short(data))
            if (data.error) {
                throw data.error
            }
        } catch (error) {
            console.log(error)
        }
    }

    const refreshOne = async (e) => {
        try {
            const res = await fetch('http://localhost:3001/', {
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': 'http://localhost:3000/'
                },
                method: 'POST',
                body: JSON.stringify({ long: e.long })
            })
            const data = await res.json()
            console.log(data)
            dispatch(short(data))
            if (data.error) {
                throw data.error
            }
        } catch (error) {
            console.log(error)
        }
    }


    return (
        <div className="container my-4">
            <div className="text-center mb-4">
                <h1 className="display-4 fw-bold text-primary">
                    URL <span className="text-secondary">Shortener</span>
                </h1>
                <p className="lead text-muted">
                    Simplify your URLs with just one click!
                </p>
            </div>
            <div className="card mb-4 shadow">
                <div className="card-body">
                    <form onSubmit={handleShort} className="row g-3">
                        <div className="col-md-8">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Enter the URL to shorten"
                                onChange={changeUrl}
                                value={url}
                            />
                        </div>
                        <div className="col-md-4">
                            <button type="submit" className="btn btn-primary w-100">
                                Shorten URL
                            </button>
                        </div>
                    </form>
                    {shortUrl && (
                        <div className="mt-3">
                            <div className="alert alert-success d-flex justify-content-between align-items-center">
                                <span>Short URL: {shortUrl}</span>
                                <button className="btn btn-outline-secondary btn-sm">
                                    Copy
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <table className="table table-striped table-hover">
                    <thead className="table-dark">
                        <tr>
                            <th>URL</th>
                            <th>Short</th>
                            <th>Clicks</th>
                            <th>Delete</th>
                            <th>Refresh</th>
                        </tr>
                    </thead>
                    <tbody>
                        {all === null
                            ? ''
                            : all.map((data) => (
                                <tr key={data.id}>
                                    <td>
                                        <a
                                            href={data.long}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {data.long}
                                        </a>
                                    </td>
                                    <td>
                                        <a
                                            href={`http://localhost:3001/url/${data.short}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {data.short}
                                        </a>
                                    </td>
                                    <td>{data.clicks}</td>
                                    <td>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => removeOne(data)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                    <td>
                                        <button
                                            className="btn btn-warning btn-sm"
                                            onClick={() => refreshOne(data)}
                                        >
                                            Refresh
                                        </button>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
    
}

export default Home