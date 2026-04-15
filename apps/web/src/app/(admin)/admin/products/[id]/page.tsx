'use client';

import { useEffect, useState } from 'react';
import ProductForm from '@/components/admin/ProductForm';
import { authenticatedFetchApi } from '@/lib/api';
import { Product } from '@/lib/types';

export default function EditProductPage({ params }: { params: { id: string } }) {
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const data = await authenticatedFetchApi<Product>(`/admin/products/${params.id}`);
                setProduct(data);
            } catch (error) {
                console.error('Failed to load product', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [params.id]);

    if (loading) {
        return <div className="text-center py-10">Loading...</div>;
    }

    if (!product) {
        return <div className="text-center py-10 text-red-500">Product not found</div>;
    }

    return <ProductForm initialData={product} />;
}
