import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { Map, TileLayer, Marker } from 'react-leaflet';
import { LeafletMouseEvent } from 'leaflet';


import Dropzone from '../../components/Dropzone';

import api from '../../services/api';
import axios from 'axios';

import './styles.css';
import Logo from '../../assets/logo.svg'


// sempre quando criamos um estado para um array ou objeto precisa manualmente informar o tipo da variavel
interface Item {
  id: number;
  image_url: string;
  title: string
}


interface IBGEUFresponse {
  sigla: string;
}

interface IBGECITYresponse {
  nome: string,
}


const CreatePoint: React.FC = () => {
  const history = useHistory();

  const [items, setItems] = useState<Item[]>([]);
  const [ufs, setUfs] = useState<string[]>([]);
  const [city, setCity] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name:'',
    email:'',
    whatsapp:'',
  });

  const [initialPosition, setInitialPosition] = useState<[number, number]>([0, 0]);

  const [selectedUf, setSelectedUf] = useState('0');
  const [selectedCity, setSelectedCity] = useState('0');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0, 0]);
  const [selectedFile, setSelectedFile] = useState<File>();


  useEffect(() => {
    navigator.geolocation.getCurrentPosition(position => {
      const { latitude, longitude } = position.coords;

      setInitialPosition([latitude, longitude]);
    })
  },[]);

  useEffect(() => {
    api.get('/items').then((response) => {
      setItems(response.data);
    });
  }, []);

  useEffect(() => {
    axios.get<IBGEUFresponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados')
      .then(response => {
        const ufInitials = response.data.map(uf => uf.sigla);

        setUfs(ufInitials);
      });
  }, []);

  useEffect(() => {
    //Carregar as cidades sempre que o uf carregar
    axios.get<IBGECITYresponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`)
      .then(response => {
        const city = response.data.map(cities => cities.nome);

        setCity(city);
      })
  }, [selectedUf]);


  function handleSelectUf(e: ChangeEvent<HTMLSelectElement>) {
    const uf = e.target.value;

    setSelectedUf(uf);
  }

  function handleSelectCity(e: ChangeEvent<HTMLSelectElement>) {
    const city = e.target.value;

    setSelectedCity(city);
  }

  function handleMapClick(e: LeafletMouseEvent) {
    setSelectedPosition([
      e.latlng.lat,
      e.latlng.lng
    ]);
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
   const { name, value } = e.target;

    setFormData({ ...formData, [name]: value});
  }

  function handleSelectItem(id: number) {
    const alreadySelected = selectedItems.findIndex(item => item === id);

    if(alreadySelected >=0){
      const filteredItems = selectedItems.filter(item => item !== id);
      setSelectedItems(filteredItems);
    }else {
      setSelectedItems([...selectedItems, id]);
    }

  }

  async function handleSubmit(e: FormEvent){
    e.preventDefault();

    const {name, email, whatsapp} = formData;
    const uf = selectedUf;
    const city = selectedCity;
    const [latitude, longitude] = selectedPosition
    const items = selectedItems;

    const data = new FormData();
      data.append('name',name);
      data.append('email',email);
      data.append('whatsapp',whatsapp);
      data.append('uf',uf);
      data.append('city',city);
      data.append('latitude',String(latitude));
      data.append('longitude',String(longitude));
      data.append('items',items.join(','));
      //Condição verificando se o arquivo e válido
      if(selectedFile) {
        data.append('image', selectedFile)
      }
  

    await api.post('/points', data);

    history.push('/');
   
    alert('Ponto de Coleta Criado');
  }

  return (
    <div id="page-create-point">
      <header>
        <img src={Logo} alt="Ecoleta" />

        <Link to="/">
          <FiArrowLeft />
          Voltar para home
        </Link>
      </header>

      <form onSubmit={handleSubmit}>
        <h1>Cadastro do <br /> ponto de coleta</h1>

        <Dropzone onFileUploaded={setSelectedFile}/>

        {/* init fieldset-Dados */}
        <fieldset>
          <legend>
            <h2>Dados</h2>
          </legend>
          <div className="field">
            <label htmlFor="name">Nome da entidade</label>
            <input
              type="text"
              name="name"
              id="name"
              onChange={handleInputChange}
            />
          </div>

          <div className="field-group">
            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input
                type="email"
                name="email"
                id="email"
                onChange={handleInputChange}
              />
            </div>
            <div className="field">
              <label htmlFor="whatsapp">Whatsapp</label>
              <input
                type="text"
                name="whatsapp"
                id="whatsapp"
                onChange={handleInputChange}
              />
            </div>
          </div>
        </fieldset>
        {/* end fieldset-Dados */}

        {/* init fieldset endereço */}
        <fieldset>
          <legend>
            <h2>Endereço</h2>
            <span>Selecione o endereço no mapa</span>
          </legend>

          <Map center={initialPosition} zoom={15} onClick={handleMapClick}>
            <TileLayer
              attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Marker position={selectedPosition} />
          </Map>

          <div className="field-group">
            <div className="field">
              <label htmlFor="uf">Estado (UF)</label>

              <select name="uf" id="uf" value={selectedUf} onChange={handleSelectUf}>
                <option value="0">Selecione uma UF</option>
                {ufs.map(uf => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>


            </div>

            <div className="field">
              <label htmlFor="city">Cidade</label>
              <select name="city" id="city" value={selectedCity} onChange={handleSelectCity}>
                <option value="0">Selecione uma Cidade</option>
                {city.map(cities => (
                  <option key={cities} value={cities}>{cities}</option>

                ))}
              </select>
            </div>

          </div>
        </fieldset>
        {/* end fieldset endereço */}


        <fieldset>
          <legend>
            <h2>Itens de coleta</h2>
            <span>Selecione um ou mais itens abaixo</span>
          </legend>

          <ul className="items-grid">
            {items.map(item => (
              <li key={item.id} onClick={() => handleSelectItem(item.id)} 
              className={selectedItems.includes(item.id) ? 'selected' : ''}
              
              
              >
                <img src={item.image_url} alt={item.title} />
                <span>{item.title}</span>
              </li>
            ))}

          </ul>
        </fieldset>

        <button type="submit">Cadastrar ponto de coleta</button>
      </form>
    </div>
  );
}

export default CreatePoint;