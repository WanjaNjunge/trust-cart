'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { Save, ArrowLeft, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { authenticatedFetchApi, authenticatedRequest } from '@/lib/api';
import { Category, Brand, Product, CreateProductRequest, ProductCondition } from '@/lib/types';
import SuccessModal from '@/components/ui/SuccessModal';

interface ProductFormProps {
  initialData?: Product;
}

const CONDITIONS: ProductCondition[] = [
  'BRAND_NEW',
  'OPEN_BOX',
  'CERTIFIED_REFURBISHED',
  'EX_UK',
  'EX_USA',
];

export default function ProductForm({ initialData }: ProductFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const { register, control, handleSubmit, formState: { errors }, watch } = useForm<CreateProductRequest>({
    defaultValues: initialData ? {
      name: initialData.name,
      description: initialData.description,
      shortDescription: initialData.shortDescription,
      price: initialData.price,
      compareAtPrice: initialData.compareAtPrice,
      condition: initialData.condition,
      categoryId: initialData.category?.id,
      brandId: initialData.brand?.id,
      isActive: initialData.isActive,
      isFeatured: initialData.isFeatured,
      quantityOnHand: initialData.availableQuantity, // This is an approximation as we don't get the raw QOH easily from simple Product type, assuming available = QOH for now or handling separately
      images: initialData.images?.map(img => ({
        url: img.url,
        altText: img.altText,
        isPrimary: img.isPrimary
      })),
      attributes: initialData.attributes?.map(attr => ({
        name: attr.name,
        value: attr.value
      }))
    } : {
      condition: 'BRAND_NEW',
      isActive: true,
      images: [],
      attributes: []
    }
  });

  const { fields: imageFields, append: appendImage, remove: removeImage } = useFieldArray({
    control,
    name: 'images'
  });

  const { fields: attrFields, append: appendAttr, remove: removeAttr } = useFieldArray({
    control,
    name: 'attributes'
  });

  useEffect(() => {
    // Fetch dependencies
    const fetchData = async () => {
      try {
        const [cats, brnds] = await Promise.all([
          authenticatedFetchApi<{ data: Category[] }>('/categories'),
          authenticatedFetchApi<{ data: Brand[] }>('/brands')
        ]);
        setCategories(cats.data);
        setBrands(brnds.data);
      } catch (error) {
        console.error('Failed to load form data', error);
      }
    };
    fetchData();
  }, []);

  const onSubmit = async (data: CreateProductRequest) => {
    setSaving(true);
    try {
      const url = initialData ? `/admin/products/${initialData.id}` : '/admin/products';
      const method = initialData ? 'PATCH' : 'POST';

      // Ensure numeric types
      const payload = {
        ...data,
        price: Number(data.price),
        compareAtPrice: data.compareAtPrice ? Number(data.compareAtPrice) : undefined,
        quantityOnHand: data.quantityOnHand ? Number(data.quantityOnHand) : undefined,
      };

      await authenticatedRequest(url, {
        method,
        body: JSON.stringify(payload)
      });

      // Show success modal instead of immediate redirect
      setShowSuccessModal(true);
    } catch (error) {
      alert('Failed to save product');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    router.push('/admin/products');
    router.refresh();
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 pb-10">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/products" className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold font-display text-slate-900">
                {initialData ? 'Edit Product' : 'New Product'}
              </h1>
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            <Save className="-ml-1 mr-2 h-5 w-5" />
            {saving ? 'Saving...' : 'Save Product'}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">

            {/* Basic Info */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              <h2 className="text-lg font-semibold text-slate-900">Basic Information</h2>

              <div>
                <label className="block text-sm font-medium text-slate-700">Product Name</label>
                <input
                  {...register('name', { required: 'Name is required' })}
                  type="text"
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Description</label>
                <textarea
                  {...register('description', { required: 'Description is required' })}
                  rows={5}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Short Description</label>
                <input
                  {...register('shortDescription')}
                  type="text"
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Images */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Images</h2>
                <button
                  type="button"
                  onClick={() => appendImage({ url: '' })}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  + Add Image
                </button>
              </div>

              <div className="space-y-4">
                {imageFields.map((field, index) => (
                  <div key={field.id} className="flex gap-4 items-start">
                    <div className="flex-1 space-y-2">
                      <input
                        {...register(`images.${index}.url` as const, { required: true })}
                        placeholder="Image URL (start with http...)"
                        className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                      <div className="flex gap-4">
                        <input
                          {...register(`images.${index}.altText` as const)}
                          placeholder="Alt Text"
                          className="block w-1/2 rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs"
                        />
                        <label className="flex items-center gap-2 text-sm text-slate-600">
                          <input
                            type="checkbox"
                            {...register(`images.${index}.isPrimary` as const)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          Primary
                        </label>
                      </div>
                    </div>
                    {watch(`images.${index}.url`) && (
                      <div className="h-16 w-16 bg-slate-100 rounded border border-slate-200 overflow-hidden flex-shrink-0">
                        <img src={watch(`images.${index}.url`)} className="h-full w-full object-cover" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="p-2 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
                {imageFields.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-lg text-slate-500">
                    No images added yet.
                  </div>
                )}
              </div>
            </div>

            {/* Attributes */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Specifications / Attributes</h2>
                <button
                  type="button"
                  onClick={() => appendAttr({ name: '', value: '' })}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  + Add Attribute
                </button>
              </div>

              <div className="space-y-4">
                {attrFields.map((field, index) => (
                  <div key={field.id} className="flex gap-4 items-center">
                    <input
                      {...register(`attributes.${index}.name` as const, { required: true })}
                      placeholder="Name (e.g. Screen Size)"
                      className="block w-1/3 rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    <input
                      {...register(`attributes.${index}.value` as const, { required: true })}
                      placeholder="Value (e.g. 15 inch)"
                      className="block flex-1 rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeAttr(index)}
                      className="p-2 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Sidebar Column */}
          <div className="space-y-8">
            {/* Status & Organization */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              <h2 className="text-base font-semibold text-slate-900">Organization</h2>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    {...register('isActive')}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Active (Visible in store)
                </label>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    {...register('isFeatured')}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Featured Product
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Brand</label>
                <select
                  {...register('brandId')}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Select Brand</option>
                  {brands.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Category</label>
                <select
                  {...register('categoryId', { required: 'Category is required' })}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Select Category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {errors.categoryId && <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Condition</label>
                <select
                  {...register('condition')}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  {CONDITIONS.map(c => (
                    <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pricing & Inventory */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              <h2 className="text-base font-semibold text-slate-900">Pricing & Inventory</h2>

              <div>
                <label className="block text-sm font-medium text-slate-700">Price (KSh)</label>
                <input
                  {...register('price', { required: true, min: 0 })}
                  type="number"
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Compare At Price (KSh)</label>
                <input
                  {...register('compareAtPrice', { min: 0 })}
                  type="number"
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Quantity On Hand</label>
                <input
                  {...register('quantityOnHand', { min: 0 })}
                  type="number"
                  placeholder="0"
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-slate-500">Initial stock for new products.</p>
              </div>
            </div>
          </div>
        </div>
      </form>

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        title="Product Saved Successfully"
        message={`The product "${watch('name')}" has been ${initialData ? 'updated' : 'created'} successfully.`}
        actionLabel="Go to Products List"
        onAction={handleSuccessModalClose}
      />
    </>
  );
}
